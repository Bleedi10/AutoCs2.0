from django.core.management.base import BaseCommand
from core.models import Plan


class Command(BaseCommand):
    help = "Crea planes Básico, Pro y Enterprise si no existen"

    def handle(self, *args, **options):
        plans = [
            ("basic", "Básico", 1, "4900.00"),
            ("pro", "Pro", 5, "14900.00"),
            ("enterprise", "Enterprise", 20, "49900.00"),
        ]

        created = 0
        for code, name, quota, price in plans:
            obj, was_created = Plan.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "rut_quota": quota,
                    "price_month": price,
                    "is_active": True,
                },
            )
            if not was_created:
                # Actualiza por si cambiaron
                changed = False
                if obj.name != name:
                    obj.name = name; changed = True
                if obj.rut_quota != quota:
                    obj.rut_quota = quota; changed = True
                if str(obj.price_month) != str(price):
                    obj.price_month = price; changed = True
                if not obj.is_active:
                    obj.is_active = True; changed = True
                if changed:
                    obj.save()
            else:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Planes listos. Creados: {created}"))

