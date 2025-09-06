# core/models.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone


# -----------------------------
# Helpers / constantes
# -----------------------------
RUT_STATE = (
    ("empty", "Empty"),
    ("available", "Available"),
    ("locked", "Locked"),
)

FORM_TYPE = (
    ("compras", "Compras"),
    ("ventas", "Ventas"),
)

FORM_STATUS = (
    ("draft", "Draft"),
    ("validating", "Validating"),
    ("stored", "Stored"),
    ("done", "Done"),
    ("error", "Error"),
)

SUBS_STATUS = (
    ("none", "None"),
    ("active", "Active"),
    ("past_due", "Past due"),
    ("canceled", "Canceled"),
)


def normalize_rut(raw: str) -> str:
    """Normaliza un RUT chileno (simplificado):
    - Quita puntos/espacios, deja guión y dígito verificador en mayúscula.
    - No valida DV aquí.
    """
    if not raw:
        return ""
    s = raw.replace(".", "").replace(" ", "").upper()
    return s


def validate_rut(rut: str) -> bool:
    """Valida RUT chileno con dígito verificador.
    Acepta formato 12345678-5 o 12345678-K (mayúscula).
    """
    if not rut or "-" not in rut:
        return False
    num, dv = rut.split("-", 1)
    if not num.isdigit():
        return False
    dv = dv.upper()
    # Cálculo del DV (módulo 11 con factores 2..7 repetidos)
    total = 0
    factor = 2
    for d in reversed(num):
        total += int(d) * factor
        factor += 1
        if factor > 7:
            factor = 2
    resto = 11 - (total % 11)
    if resto == 11:
        dv_calc = "0"
    elif resto == 10:
        dv_calc = "K"
    else:
        dv_calc = str(resto)
    return dv == dv_calc


# -----------------------------
# Modelos
# -----------------------------
class Plan(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=80)
    price_month = models.DecimalField(max_digits=10, decimal_places=2)
    rut_quota = models.PositiveSmallIntegerField(choices=((1, "1"), (2, "2"), (4, "4")))
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.rut_quota} RUTs)"


class UserSubscriptionCurrent(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    status = models.CharField(max_length=16, choices=SUBS_STATUS, default="active")
    activated_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)
    provider = models.CharField(max_length=32, blank=True)
    external_subscription_id = models.CharField(max_length=128, blank=True)

    def __str__(self) -> str:
        return f"{self.user} → {self.plan.code} ({self.status})"


class UserSubscriptionHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    status_from = models.CharField(max_length=16, choices=SUBS_STATUS, default="none")
    status_to = models.CharField(max_length=16, choices=SUBS_STATUS, default="active")
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(null=True, blank=True)
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)


class UserRutSlot(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_rut_slots"
    )
    slot_index = models.PositiveSmallIntegerField()
    rut = models.CharField(max_length=16, blank=True)
    state = models.CharField(max_length=12, choices=RUT_STATE, default="empty")
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by_form = models.ForeignKey("Form", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "slot_index"], name="uq_rutslot_user_slotindex"
            )
        ]
        indexes = [
            models.Index(fields=["user", "slot_index"]),
            models.Index(fields=["user", "rut"]),
        ]

    def clean(self):
        # Normaliza
        self.rut = normalize_rut(self.rut)

        # Si slot está bloqueado, prohibir cambio de rut
        if self.pk and self.state == "locked":
            orig = UserRutSlot.objects.get(pk=self.pk)
            if orig.rut != self.rut:
                raise ValidationError("No se puede editar un RUT bloqueado.")

        # Si hay RUT, validar DV y evitar duplicados en los slots del mismo usuario
        if self.rut:
            if not validate_rut(self.rut):
                raise ValidationError("RUT inválido. Revisa el dígito verificador.")
            qs = UserRutSlot.objects.filter(user_id=self.user_id, rut=self.rut)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Ya tienes este RUT en otro slot.")

    def set_available(self):
        self.state = "available"
        self.locked_at = None
        self.locked_by_form = None

    def lock(self, form: "Form"):
        if self.state == "available":
            self.state = "locked"
            self.locked_at = timezone.now()
            self.locked_by_form = form

    def __str__(self) -> str:
        return f"{self.user_id}#{self.slot_index}:{self.rut or '—'}({self.state})"


class Form(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=16, choices=FORM_TYPE)
    sii_rut = models.CharField(max_length=16)  # RUT utilizado en este envío
    created_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=FORM_STATUS, default="draft")
    error_message = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"Form({self.type}) by {self.user_id} [{self.status}]"

    @transaction.atomic
    def submit_and_lock_first_use(self, slot_id: int):
        slot = (
            UserRutSlot.objects.select_for_update()
            .select_related()
            .get(pk=slot_id, user=self.user)
        )
        self.status = "stored"
        self.submitted_at = timezone.now()
        self.save(update_fields=["status", "submitted_at"])

        if slot.state == "available":
            slot.lock(self)
            slot.save(update_fields=["state", "locked_at", "locked_by_form"])
            AuditLog.log(
                self.user_id,
                "rut_slot_locked",
                "user_rut_slot",
                str(slot.pk),
                {"rut": slot.rut},
            )
        else:
            AuditLog.log(
                self.user_id, "form_submitted", "form", str(self.pk), {"slot_id": slot.pk}
            )


class FileUpload(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="file_uploads")
    file_kind = models.CharField(max_length=32)  # compras_33|compras_46|ventas_33|ventas_36
    storage_uri = models.TextField()
    original_filename = models.TextField()
    content_hash = models.CharField(max_length=128, blank=True)
    rows_count = models.PositiveIntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class FormPayload(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="form_payloads")
    payload_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    action = models.CharField(max_length=64)
    entity = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    metadata = models.JSONField(default=dict)
    at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def log(
        cls, user_id: Optional[int], action: str, entity: str, entity_id: str, metadata: dict
    ):
        return cls.objects.create(
            user_id=user_id, action=action, entity=entity, entity_id=entity_id, metadata=metadata
        )


# -----------------------------
# Señales: sincronizar slots al cambiar de plan
# -----------------------------
from django.db.models.signals import post_save  # noqa: E402
from django.dispatch import receiver  # noqa: E402


@dataclass
class _SlotsSyncResult:
    created: int = 0
    removed: int = 0
    unlocked: int = 0


def _sync_slots_for_quota(user_id: int, new_quota: int) -> _SlotsSyncResult:
    """Ajusta slots al cupo:
      - UPGRADE: desbloquea todos los slots existentes y crea los faltantes.
      - DOWNGRADE: elimina los slots sobrantes y DESBLOQUEA los que permanecen (1..new_quota).
    """
    res = _SlotsSyncResult()
    with transaction.atomic():
        slots = list(
            UserRutSlot.objects.select_for_update()
            .filter(user_id=user_id)
            .order_by("slot_index")
        )
        current = len(slots)

        # UPGRADE → desbloquear todos + crear faltantes
        if new_quota > current:
            for s in slots:
                if s.state == "locked":
                    s.set_available()
                    s.save(update_fields=["state", "locked_at", "locked_by_form"])
                    res.unlocked += 1
            for idx in range(current + 1, new_quota + 1):
                UserRutSlot.objects.create(user_id=user_id, slot_index=idx, state="empty")
                res.created += 1

        # DOWNGRADE → borrar excedentes + desbloquear los que quedan
        elif new_quota < current:
            to_delete = [s for s in slots if s.slot_index > new_quota]
            UserRutSlot.objects.filter(pk__in=[s.pk for s in to_delete]).delete()
            res.removed = len(to_delete)

            remaining = (
                UserRutSlot.objects.select_for_update()
                .filter(user_id=user_id, slot_index__lte=new_quota)
                .order_by("slot_index")
            )
            for s in remaining:
                if s.state == "locked":
                    s.set_available()
                    s.save(update_fields=["state", "locked_at", "locked_by_form"])
                    res.unlocked += 1

    return res


@receiver(post_save, sender=UserSubscriptionCurrent)
def on_subscription_changed(
    sender, instance: UserSubscriptionCurrent, created: bool, **kwargs
):
    quota = instance.plan.rut_quota
    result = _sync_slots_for_quota(instance.user_id, quota)
    AuditLog.log(
        instance.user_id,
        action="subscription_sync_slots",
        entity="user_subscription_current",
        entity_id=str(instance.pk),
        metadata={"quota": quota, "result": result.__dict__},
    )


# -----------------------------
# Admin
# -----------------------------
from django.contrib import admin  # noqa: E402


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "rut_quota", "price_month", "is_active")
    list_filter = ("rut_quota", "is_active")
    search_fields = ("code", "name")


@admin.register(UserSubscriptionCurrent)
class USCAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status", "activated_at", "expires_at")
    list_filter = ("status", "plan")
    search_fields = ("user__email",)


@admin.register(UserSubscriptionHistory)
class USHAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status_from", "status_to", "valid_from", "valid_to")
    list_filter = ("status_from", "status_to", "plan")
    search_fields = ("user__email",)


@admin.register(UserRutSlot)
class SlotAdmin(admin.ModelAdmin):
    list_display = ("user", "slot_index", "rut", "state", "locked_at")
    list_filter = ("state",)
    search_fields = ("user__email", "rut")


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "status", "created_at", "submitted_at")
    list_filter = ("type", "status")
    search_fields = ("user__email", "sii_rut")


@admin.register(FileUpload)
class FUAdmin(admin.ModelAdmin):
    list_display = ("form", "file_kind", "uploaded_at")


@admin.register(FormPayload)
class FPAdmin(admin.ModelAdmin):
    list_display = ("form", "created_at")


@admin.register(AuditLog)
class AuditAdmin(admin.ModelAdmin):
    list_display = ("at", "user", "action", "entity", "entity_id")
    list_filter = ("action",)
    search_fields = ("user__email", "entity", "entity_id")
