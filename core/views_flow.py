from __future__ import annotations

import logging
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.conf import settings
from django.utils import timezone

from .models import Plan, UserSubscriptionCurrent, UserRutSlot, Form, AuditLog


def _get_mp_sdk():
    try:
        import mercadopago  # type: ignore
    except Exception:
        return None
    access_token = getattr(settings, "MP_ACCESS_TOKEN", "")
    if not access_token:
        return None
    try:
        sdk = mercadopago.SDK(access_token)
        return sdk
    except Exception:
        return None

log = logging.getLogger(__name__)


def landing_view(request: HttpRequest) -> HttpResponse:
    return render(request, "core/landing.html", {})


def precios_view(request: HttpRequest) -> HttpResponse:
    plans = Plan.objects.filter(is_active=True).order_by("price_month")
    sub = None
    if request.user.is_authenticated:
        sub = (
            UserSubscriptionCurrent.objects.filter(user=request.user)
            .select_related("plan")
            .first()
        )
    return render(request, "core/precios.html", {"plans": plans, "subscription": sub})


def contratar_plan_view(request: HttpRequest, plan_code: str) -> HttpResponse:
    plan = get_object_or_404(Plan, code=plan_code, is_active=True)
    if not request.user.is_authenticated:
        return redirect(reverse("account_signup") + f"?plan={plan.code}")

    # Si tiene suscripción activa existente, cancelarla en MP y dejar sin plan
    existing = UserSubscriptionCurrent.objects.filter(user=request.user).first()
    preapproval_id = None
    if existing and existing.external_subscription_id:
        sdk = _get_mp_sdk()
        if sdk:
            try:
                sdk.preapproval().update(existing.external_subscription_id, {"status": "cancelled"})
            except Exception:
                pass
        # Remover slots y dejar al usuario sin suscripción
        UserRutSlot.objects.filter(user=request.user).delete()
        existing.delete()

    # Crear preapproval (suscripción recurrente)
    sdk = _get_mp_sdk()
    if not sdk:
        messages.error(request, "Configuración de Mercado Pago incompleta. Contacta soporte.")
        return redirect("precios")

    back_url = (getattr(settings, "PUBLIC_BASE_URL", "") or request.build_absolute_uri("/")) + reverse(
        "billing_return"
    )
    reason = f"Suscripción {plan.name} ({plan.rut_quota} RUTs)"
    ext_ref = f"user:{request.user.id}|plan:{plan.code}"
    try:
        payload = {
            "payer_email": request.user.email,
            "back_url": back_url,
            "reason": reason,
            "external_reference": ext_ref,
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": float(plan.price_month),
                "currency_id": "CLP",
            },
        }
        resp = sdk.preapproval().create(
            {
                **payload
            }
        )
    except Exception as e:
        messages.error(request, f"Error creando suscripción: {e}")
        return redirect("precios")

    status = resp.get("status")
    body = resp.get("response", {}) or {}
    init_point = body.get("init_point") or body.get("sandbox_init_point")
    # Auditar contexto (enmascarado)
    try:
        AuditLog.log(
            request.user.id,
            action="preapproval_create",
            entity="plan",
            entity_id=plan.code,
            metadata={
                "status": status,
                "response_keys": list((resp.get("response") or {}).keys()),
                "access_token_prefix": str(getattr(settings, "MP_ACCESS_TOKEN", ""))[:5],
                "is_test": getattr(settings, "MP_IS_TEST", False),
                "payload": {**payload, "payer_email": "***masked***"},
            },
        )
    except Exception:
        pass

    if status not in (200, 201) or not init_point:
        msg = body.get("message") or body.get("error") or "No recibimos URL de autorización."
        messages.error(request, f"Mercado Pago no pudo iniciar la suscripción. {msg}")
        return redirect("precios")

    # Redirigir al flujo de autorización de suscripción
    return redirect(init_point)


@login_required
def account_view(request: HttpRequest) -> HttpResponse:
    sub = (
        UserSubscriptionCurrent.objects.filter(user=request.user).select_related("plan").first()
    )
    slots = UserRutSlot.objects.filter(user=request.user).order_by("slot_index")
    return render(request, "core/account.html", {"subscription": sub, "slots": slots})


@login_required
def slot_update_view(request: HttpRequest, slot_id: int) -> HttpResponse:
    slot = get_object_or_404(UserRutSlot, id=slot_id, user=request.user)
    if request.method == "POST":
        rut = (request.POST.get("rut") or "").strip()
        if slot.state == "locked":
            messages.error(request, "Ese slot está bloqueado y no es editable.")
            return redirect("account")
        slot.rut = rut
        try:
            slot.full_clean()
        except Exception as e:
            messages.error(request, "; ".join([str(x) for x in getattr(e, "messages", [str(e)])]))
            return redirect("account")
        slot.state = "available" if slot.rut else "empty"
        slot.save()
        messages.success(request, "Slot actualizado.")
    return redirect("account")


@login_required
def slot_delete_view(request: HttpRequest, slot_id: int) -> HttpResponse:
    slot = get_object_or_404(UserRutSlot, id=slot_id, user=request.user)
    if slot.state == "locked":
        messages.error(request, "No puedes eliminar un RUT bloqueado.")
        return redirect("account")
    slot.rut = ""
    slot.state = "empty"
    slot.locked_at = None
    slot.locked_by_form = None
    slot.save(update_fields=["rut", "state", "locked_at", "locked_by_form"])
    messages.success(request, "Slot vaciado.")
    return redirect("account")


@login_required
def formulario_view(request: HttpRequest) -> HttpResponse:
    sub = (
        UserSubscriptionCurrent.objects.filter(user=request.user).select_related("plan").first()
    )
    if not (sub and sub.plan and sub.status == "active"):
        return render(request, "core/formulario.html", {"has_active": False})

    if request.method == "POST":
        slot_id = int(request.POST.get("slot_id") or 0)
        if not slot_id:
            messages.error(request, "Selecciona un RUT válido.")
            return redirect("formulario")
        form = Form.objects.create(
            user=request.user,
            type=(request.POST.get("type") or "compras"),
            sii_rut=(request.POST.get("sii_rut") or ""),
        )
        try:
            form.submit_and_lock_first_use(slot_id=slot_id)
        except Exception as e:
            messages.error(request, f"No se pudo enviar: {e}")
            return redirect("formulario")
        messages.success(request, "Formulario enviado y RUT bloqueado en primer uso.")
        return redirect("formulario")

    slots = UserRutSlot.objects.filter(user=request.user).order_by("slot_index")
    return render(request, "core/formulario.html", {"has_active": True, "slots": slots})


@login_required
def billing_return_preapproval(request: HttpRequest) -> HttpResponse:
    # No activamos aquí; solo informamos estado. Activación llega por webhook.
    status = (request.GET.get("status") or request.GET.get("collection_status") or "").lower()
    if status in ("approved", "authorized"):
        messages.info(request, "Suscripción aprobada. Activaremos tu plan al confirmar el webhook.")
    elif status in ("rejected", "cancelled", "paused"):
        messages.error(request, "Suscripción rechazada o cancelada. Inténtalo nuevamente o elige otro medio.")
    else:
        messages.info(request, "Tu suscripción está pendiente de confirmación (webhook).")
    return redirect("account")
