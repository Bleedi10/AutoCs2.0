# core/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import UserRutSlot, Form, AuditLog

@receiver(pre_save, sender=UserRutSlot)
def audit_slot_state_change(sender, instance: UserRutSlot, **kwargs):
    if not instance.pk:
        return  # Sólo nos interesa cambios en existentes
    try:
        prev = UserRutSlot.objects.get(pk=instance.pk)
    except UserRutSlot.DoesNotExist:
        return
    if prev.state != instance.state:
        AuditLog.log(
            user_id=instance.user_id,
            action="rut_slot_state_changed",
            entity="user_rut_slot",
            entity_id=str(instance.pk),
            metadata={"from": prev.state, "to": instance.state, "rut": instance.rut},
        )

@receiver(post_save, sender=Form)
def audit_form_saved(sender, instance: Form, created: bool, **kwargs):
    AuditLog.log(
        user_id=instance.user_id,
        action="form_created" if created else "form_updated",
        entity="form",
        entity_id=str(instance.pk),
        metadata={"status": instance.status, "type": instance.type},
    )
