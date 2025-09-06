# core/management/commands/normalize_slots.py
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import UserRutSlot

class Command(BaseCommand):
    help = "Normaliza el estado de slots legacy: empty / available / locked."

    def handle(self, *args, **options):
        updated = 0
        total = UserRutSlot.objects.count()
        with transaction.atomic():
            # lock optimista por seguridad
            for s in UserRutSlot.objects.all().select_for_update():
                orig = s.state
                if s.locked_at or (s.state == "locked"):
                    new_state = "locked"
                else:
                    rut_val = (s.rut or "").strip()
                    new_state = "available" if rut_val else "empty"

                if new_state != orig:
                    s.state = new_state
                    s.save(update_fields=["state"])
                    updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"normalize_slots: {updated}/{total} actualizados."
        ))
