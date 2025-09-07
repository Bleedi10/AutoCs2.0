from django.urls import path
from . import views  # billing y otros
from . import views_flow as vf
from . import views_api as api

urlpatterns = [
    # Landing / públicas
    path("", vf.landing_view, name="landing"),

    # Precios
    path("precios/", vf.precios_view, name="precios"),
    path("precios/contratar/<str:plan_code>/", vf.contratar_plan_view, name="contratar_plan"),

    # Área autenticada
    path("account/", vf.account_view, name="account"),
    path("account/slot/<int:slot_id>/update/", vf.slot_update_view, name="slot_update"),
    path("account/slot/<int:slot_id>/delete/", vf.slot_delete_view, name="slot_delete"),

    # Formulario
    path("formulario/", vf.formulario_view, name="formulario"),

    # Compat de rutas anteriores (no romper enlaces ya existentes)
    path("pricing/", vf.precios_view, name="pricing"),
    path("form/new/", vf.formulario_view, name="form_new"),
    path("form/success/", views.form_success_view, name="form_success"),

    # Billing (Checkout Pro) existente
    path("billing/checkout/<str:plan_code>/", views.billing_checkout, name="billing_checkout"),
    path("billing/return/", vf.billing_return_preapproval, name="billing_return"),

    # Webhook MP
    path("webhooks/mercadopago", views.billing_webhook, name="billing_webhook_no_slash"),
    path("webhooks/mercadopago/", views.billing_webhook, name="billing_webhook"),

    # API pública para Next.js
    path("api/plans/", api.api_plans, name="api_plans"),
    path("api/auth/upsert_user/", api.api_auth_upsert_user, name="api_auth_upsert_user"),
    path("api/user/status/", api.api_user_status, name="api_user_status"),
    path("api/subscriptions/start/", api.api_subscriptions_start, name="api_subscriptions_start"),
]
