from __future__ import annotations

from typing import Optional

from django.contrib.auth.models import AnonymousUser
from django.conf import settings

from .models import UserSubscriptionCurrent


def global_user(request):
    """Provides common user-related context for navbar.

    Exposes:
    - user_is_authenticated
    - user_email
    - user_plan_name
    - user_has_active_plan
    """
    user = getattr(request, "user", None)
    is_auth = bool(user and not isinstance(user, AnonymousUser) and user.is_authenticated)
    email = user.email if is_auth else ""
    plan_name = ""
    has_active = False

    if is_auth:
        sub: Optional[UserSubscriptionCurrent] = (
            UserSubscriptionCurrent.objects.filter(user=user).select_related("plan").first()
        )
        if sub and sub.plan:
            plan_name = sub.plan.name
            has_active = (sub.status == "active")

    return {
        "user_is_authenticated": is_auth,
        "user_email": email,
        "user_plan_name": plan_name,
        "user_has_active_plan": has_active,
        "mp_is_test": getattr(settings, "MP_IS_TEST", False),
    }
