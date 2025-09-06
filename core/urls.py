from django.urls import path
from . import views

urlpatterns = [
    # Home / públicas
    path("", views.home_view, name="home"),
    path("pricing/", views.pricing_view, name="pricing"),

    # Área autenticada
    path("account/", views.account_view, name="account"),
    path("account/slot/<int:slot_id>/update/", views.slot_update_view, name="slot_update"),

    # Formularios
    path("form/new/", views.form_new_view, name="form_new"),
    path("form/success/", views.form_success_view, name="form_success"),

    # Billing (Checkout Pro)
    path("billing/checkout/<str:plan_code>/", views.billing_checkout, name="billing_checkout"),
    path("billing/return/", views.billing_return, name="billing_return"),

    # Webhook MP
    path("webhooks/mercadopago", views.billing_webhook, name="billing_webhook_no_slash"),
    path("webhooks/mercadopago/", views.billing_webhook, name="billing_webhook"),
]
