from __future__ import annotations

import json
import logging
from typing import Optional

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    JsonResponse,
)
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .models import (
    Plan,
    UserSubscriptionCurrent,
    UserRutSlot,
    AuditLog,
)

log = logging.getLogger(__name__)


def write_audit(user, event: str, data: dict) -> None:
    try:
        AuditLog.objects.create(
            user=user if getattr(user, "id", None) else None,
            event=event,
            payload=data,
        )
    except Exception as e:
        log.warning("AuditLog failed %s: %s", event, e)


def is_localhost_public_base() -> bool:
    base = getattr(settings, "PUBLIC_BASE_URL", "")
    return ("localhost" in base) or ("127.0.0.1" in base)


# ============ Vistas públicas ============

def home_view(request: HttpRequest) -> HttpResponse:
    return render(request, "home.html", {})


def pricing_view(request: HttpRequest) -> HttpResponse:
    plans = Plan.objects.filter(is_active=True).order_by("price_month")
    usc = None
    if request.user.is_authenticated:
        usc = UserSubscriptionCurrent.objects.filter(user=request.user).first()
    return render(request, "pricing.html", {"plans": plans, "usc": usc})


# ============ Área autenticada ============

@login_required
def account_view(request: HttpRequest) -> HttpResponse:
    usc = UserSubscriptionCurrent.objects.filter(user=request.user).first()
    slots = UserRutSlot.objects.filter(user=request.user).order_by("slot_index")
    return render(request, "account.html", {"usc": usc, "slots": slots})


@login_required
def slot_update_view(request: HttpRequest, slot_id: int) -> HttpResponse:
    slot = get_object_or_404(UserRutSlot, id=slot_id, user=request.user)
    if request.method == "POST":
        rut = (request.POST.get("rut") or "").strip()
        if slot.locked_at or slot.state == "locked":
            messages.error(request, "Ese slot está bloqueado en este momento.")
            return redirect("account")
        slot.rut = rut
        slot.save()
        messages.success(request, "Slot actualizado.")
    return redirect("account")


@login_required
def form_new_view(request: HttpRequest) -> HttpResponse:
    if request.method == "GET":
        slot = (
            UserRutSlot.objects
            .filter(user=request.user)
            .filter(Q(rut__isnull=True) | Q(rut=""))
            .order_by("slot_index")
            .first()
        )
        return render(request, "form_new.html", {"slot": slot})

    rut = (request.POST.get("rut") or "").strip()
    slot_id = request.POST.get("slot_id")

    if not rut:
        messages.error(request, "Debes indicar un RUT.")
        return redirect("form_new")

    if slot_id:
        slot = get_object_or_404(UserRutSlot, id=slot_id, user=request.user)
    else:
        slot = (
            UserRutSlot.objects
            .filter(user=request.user)
            .filter(Q(rut__isnull=True) | Q(rut=""))
            .order_by("slot_index")
            .first()
        )
        if not slot:
            messages.error(request, "No tienes slots disponibles.")
            return redirect("account")

    if slot.locked_at or slot.state == "locked":
        messages.error(request, "Ese slot está bloqueado en este momento.")
        return redirect("account")

    slot.rut = rut
    slot.save()
    messages.success(request, f"RUT guardado en el slot #{slot.slot_index}.")
    return redirect("form_success")


@login_required
def form_success_view(request: HttpRequest) -> HttpResponse:
    messages.success(request, "Formulario guardado correctamente.")
    return redirect("account")


# ============ Mercado Pago (Checkout Pro) ============

try:
    import mercadopago  # type: ignore
except Exception:  # pragma: no cover
    mercadopago = None


def _get_mp_sdk():
    if not mercadopago:
        return None
    token = getattr(settings, "MP_ACCESS_TOKEN", "") or ""
    if not token:
        return None
    return mercadopago.SDK(token)


@login_required
def billing_checkout(request: HttpRequest, plan_code: str) -> HttpResponse:
    plan = get_object_or_404(Plan, code=plan_code, is_active=True)

    public_base = getattr(settings, "PUBLIC_BASE_URL", "http://127.0.0.1:8000")
    return_url = public_base + reverse("billing_return")
    webhook_url = (
        getattr(settings, "MP_WEBHOOK_URL", "")
        or (public_base + reverse("billing_webhook"))
    )

    sdk = _get_mp_sdk()
    if not sdk:
        messages.error(request, "Mercado Pago no está configurado (falta ACCESS TOKEN).")
        write_audit(request.user, "mp_preference_sdk_missing", {"plan": plan.code})
        return redirect("pricing")

    preference_data = {
        "items": [
            {
                "title": f"{plan.name} - Auto-CS",
                "quantity": 1,
                "currency_id": "CLP",
                "unit_price": float(plan.price_month),
            }
        ],
        "back_urls": {
            "success": return_url,
            "failure": return_url,
            "pending": return_url,
        },
        **({"auto_return": "approved"} if not is_localhost_public_base() else {}),
        "notification_url": webhook_url,
        "external_reference": f"user:{request.user.id}|plan:{plan.code}",
    }

    resp = sdk.preference().create(preference_data)
    status = resp.get("status")
    body = resp.get("response", {}) or {}

    write_audit(request.user, "mp_preference_create", {
        "status": status,
        "plan": plan.code,
        "request": preference_data,
        "response": body,
    })

    if status not in (200, 201):
        msg = body.get("message") or body.get("error") or "Error creando preferencia."
        messages.error(
            request,
            f"No recibimos la URL de pago (status {status}). {msg} "
            f"{'En localhost no usamos auto_return; el alta se hace al volver.' if is_localhost_public_base() else ''}"
        )
        return redirect("pricing")

    init_point = body.get("init_point") or body.get("sandbox_init_point")
    if not init_point:
        messages.error(request, "Mercado Pago no retornó init_point.")
        return redirect("pricing")

    return redirect(init_point)


@login_required
def billing_return(request: HttpRequest) -> HttpResponse:
    status = request.GET.get("status") or request.GET.get("collection_status")
    ext_ref = request.GET.get("external_reference")
    payment_id = request.GET.get("payment_id")

    write_audit(request.user, "mp_return", {"query": dict(request.GET.items())})

    if status != "approved" or not ext_ref:
        messages.info(request, "Si tu pago fue aprobado, activaremos el plan cuando llegue la confirmación.")
        return redirect("account")

    plan_code = None
    try:
        parts = dict(pair.split(":", 1) for pair in ext_ref.split("|"))
        plan_code = parts.get("plan")
    except Exception:
        pass

    if not plan_code:
        messages.error(request, "No pudimos identificar el plan del pago.")
        return redirect("pricing")

    plan = get_object_or_404(Plan, code=plan_code, is_active=True)

    sdk = _get_mp_sdk()
    if sdk and payment_id:
        try:
            p = sdk.payment().get(payment_id)
            write_audit(
                request.user,
                "mp_payment_get_on_return",
                {"payment_id": payment_id, "status": p.get("status"), "body": p.get("response")},
            )
        except Exception as e:
            write_audit(
                request.user,
                "mp_payment_get_on_return_error",
                {"payment_id": payment_id, "error": str(e)},
            )

    usc, _ = UserSubscriptionCurrent.objects.get_or_create(user=request.user)
    usc.plan = plan
    usc.save()

    messages.success(request, "Pago aprobado y suscripción activada.")
    return redirect("account")


from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def billing_webhook(request: HttpRequest) -> HttpResponse:
    try:
        body = request.body.decode("utf-8") or "{}"
        data = json.loads(body)
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    write_audit(None, "mp_webhook_receive", {"headers": dict(request.headers.items()), "body": data})

    topic = request.GET.get("type") or data.get("type")
    action = data.get("action")

    if (topic == "payment") or (action and action.startswith("payment")):
        payment_id = data.get("data", {}).get("id") or data.get("id")
        sdk = _get_mp_sdk()
        if not (sdk and payment_id):
            return JsonResponse({"ok": True})

        try:
            p = sdk.payment().get(payment_id)
        except Exception as e:
            write_audit(None, "mp_payment_get_error", {"payment_id": payment_id, "error": str(e)})
            return JsonResponse({"ok": True})

        presp = p.get("response", {}) or {}
        pstatus = presp.get("status")
        ext_ref = presp.get("external_reference") or ""
        write_audit(None, "mp_payment_get_ok", {"payment_id": payment_id, "status": pstatus, "ext_ref": ext_ref})

        if pstatus == "approved" and ext_ref:
            try:
                parts = dict(pair.split(":", 1) for pair in ext_ref.split("|"))
                user_id = int(parts.get("user"))
                plan_code = parts.get("plan")
            except Exception:
                user_id, plan_code = None, None

            if user_id and plan_code:
                try:
                    plan = Plan.objects.get(code=plan_code, is_active=True)
                    usc, _ = UserSubscriptionCurrent.objects.get_or_create(user_id=user_id)
                    usc.plan = plan
                    usc.save()
                    write_audit(None, "mp_webhook_activate_ok", {"user_id": user_id, "plan": plan_code})
                except Exception as e:
                    write_audit(None, "mp_webhook_activate_err", {"user_id": user_id, "plan": plan_code, "error": str(e)})

    return JsonResponse({"ok": True})
