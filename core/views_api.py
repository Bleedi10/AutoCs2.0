from __future__ import annotations

from django.http import JsonResponse, HttpResponseForbidden, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string

from .models import Plan
from .views_flow import _get_mp_sdk
from django.urls import reverse
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import UserSubscriptionCurrent, UserRutSlot


def api_plans(request):
    qs = Plan.objects.filter(is_active=True).order_by('rut_quota')
    data = [
        {
            'code': p.code,
            'name': p.name,
            'price_month': str(p.price_month),
            'rut_quota': p.rut_quota,
            'is_active': p.is_active,
        }
        for p in qs
    ]
    return JsonResponse(data, safe=False)


@csrf_exempt
def api_auth_upsert_user(request):
    if request.method != "POST":
        return HttpResponseBadRequest("POST required")
    api_key = request.headers.get("X-Api-Key") or request.headers.get("X-API-KEY")
    if not api_key or api_key != getattr(settings, "FRONTEND_SYNC_API_KEY", ""):
        return HttpResponseForbidden("Invalid API key")

    try:
        import json
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    email = (body.get("email") or "").strip().lower()
    name = (body.get("name") or "").strip()
    provider = (body.get("provider") or "").strip().lower()
    provider_account_id = (body.get("provider_account_id") or "").strip()
    if not email:
        return HttpResponseBadRequest("email required")

    User = get_user_model()
    created = False
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Generate a unique username (for default Django User)
        base = email.split("@", 1)[0][:20] or "user"
        username = base
        i = 0
        while User.objects.filter(username=username).exists():
            i += 1
            username = f"{base}-{i}"
            if len(username) > 30:
                username = base[: (30 - len(str(i)) - 1)] + f"-{i}"
        user = User.objects.create(username=username, email=email, first_name=(name or "").split(" ")[0])
        created = True

    # Optionally link SocialAccount for bookkeeping
    try:
        from allauth.socialaccount.models import SocialAccount

        if provider and provider_account_id:
            sa, _ = SocialAccount.objects.get_or_create(
                user=user, provider=provider, uid=provider_account_id
            )
    except Exception:
        pass

    return JsonResponse({"ok": True, "created": created, "user_id": user.id})


def api_user_status(request):
    api_key = request.headers.get("X-Api-Key") or request.headers.get("X-API-KEY")
    if not api_key or api_key != getattr(settings, "FRONTEND_SYNC_API_KEY", ""):
        return HttpResponseForbidden("Invalid API key")
    email = (request.GET.get("email") or "").strip().lower()
    if not email:
        return HttpResponseBadRequest("email required")

    User = get_user_model()
    user = User.objects.filter(email=email).first()
    if not user:
        return JsonResponse({"has_user": False, "email": email, "plan": None, "status": "none"})

    from .models import UserSubscriptionCurrent

    sub = (
        UserSubscriptionCurrent.objects.filter(user=user)
        .select_related("plan")
        .first()
    )
    plan = None
    status = "none"
    if sub and sub.plan:
        status = sub.status
        plan = {
            "code": sub.plan.code,
            "name": sub.plan.name,
            "rut_quota": sub.plan.rut_quota,
        }
    return JsonResponse({
        "has_user": True,
        "email": email,
        "plan": plan,
        "status": status,
    })


@csrf_exempt
def api_subscriptions_start(request):
    if request.method != "POST":
        return HttpResponseBadRequest("POST required")
    api_key = request.headers.get("X-Api-Key") or request.headers.get("X-API-KEY")
    if not api_key or api_key != getattr(settings, "FRONTEND_SYNC_API_KEY", ""):
        return HttpResponseForbidden("Invalid API key")

    try:
        import json
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    email = (body.get("email") or "").strip().lower()
    plan_code = (body.get("plan") or "").strip()
    if not email or not plan_code:
        return HttpResponseBadRequest("email and plan required")

    User = get_user_model()
    user, _ = User.objects.get_or_create(email=email, defaults={"username": email.split("@", 1)[0][:30] or f"user-{get_random_string(6)}"})
    plan = get_object_or_404(Plan, code=plan_code, is_active=True)

    sdk = _get_mp_sdk()
    if not sdk:
        return HttpResponseBadRequest("Mercado Pago SDK not configured")

    # Cancelar suscripción anterior y limpiar
    with transaction.atomic():
        usc = UserSubscriptionCurrent.objects.filter(user=user).first()
        if usc and usc.external_subscription_id:
            try:
                sdk.preapproval().update(usc.external_subscription_id, {"status": "cancelled"})
            except Exception:
                pass
        if usc:
            UserRutSlot.objects.filter(user=user).delete()
            usc.delete()

    back_url = (getattr(settings, "PUBLIC_BASE_URL", "") or request.build_absolute_uri("/")) + reverse("billing_return")
    reason = f"Suscripción {plan.name} ({plan.rut_quota} RUTs)"
    ext_ref = f"user:{user.id}|plan:{plan.code}"
    try:
        resp = sdk.preapproval().create(
            {
                "payer_email": email,
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
        )
    except Exception as e:
        return HttpResponseBadRequest(f"preapproval error: {e}")

    status = resp.get("status")
    body = resp.get("response", {}) or {}
    init_point = body.get("init_point") or body.get("sandbox_init_point")
    if status not in (200, 201) or not init_point:
        msg = body.get("message") or body.get("error") or "No init_point"
        return HttpResponseBadRequest(f"mp error: {msg}")
    return JsonResponse({"init_point": init_point})
