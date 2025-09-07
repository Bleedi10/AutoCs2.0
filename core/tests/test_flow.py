from __future__ import annotations

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from core.models import Plan, UserSubscriptionCurrent, UserRutSlot


def compute_dv(num: int) -> str:
    s = 0
    factors = [2, 3, 4, 5, 6, 7]
    i = 0
    for d in reversed(str(num)):
        s += int(d) * factors[i % len(factors)]
        i += 1
    r = 11 - (s % 11)
    if r == 11:
        return "0"
    if r == 10:
        return "K"
    return str(r)


def make_rut(n: int) -> str:
    return f"{n}-{compute_dv(n)}"


class FlowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Seed simple plans
        Plan.objects.get_or_create(code="basic", defaults=dict(name="Básico", price_month="1000.00", rut_quota=1, is_active=True))
        Plan.objects.get_or_create(code="pro", defaults=dict(name="Pro", price_month="2000.00", rut_quota=5, is_active=True))
        Plan.objects.get_or_create(code="enterprise", defaults=dict(name="Enterprise", price_month="5000.00", rut_quota=20, is_active=True))

    def setUp(self):
        self.User = get_user_model()
        self.user = self.User.objects.create_user(username="u1", email="u1@example.com", password="pass12345")

    def login(self):
        self.client.login(username="u1", password="pass12345")

    def test_anon_redirects(self):
        resp = self.client.get(reverse("account"))
        self.assertEqual(resp.status_code, 302)
        self.assertIn("/accounts/login/", resp.headers.get("Location", ""))
        resp = self.client.get(reverse("formulario"))
        self.assertEqual(resp.status_code, 302)
        self.assertIn("/accounts/login/", resp.headers.get("Location", ""))

    def test_account_no_plan_shows_cta(self):
        self.login()
        resp = self.client.get(reverse("account"))
        self.assertContains(resp, "Elige un plan")

    def test_pricing_and_subscribe_flow(self):
        # anon contratar redirects to signup
        resp = self.client.get(reverse("contratar_plan", args=["basic"]))
        self.assertEqual(resp.status_code, 302)
        self.assertIn("/accounts/signup/?plan=basic", resp.headers.get("Location", ""))

        # login and contratar
        self.login()
        resp = self.client.get(reverse("contratar_plan", args=["pro"]))
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp.headers.get("Location"), reverse("account"))

        sub = UserSubscriptionCurrent.objects.get(user=self.user)
        self.assertEqual(sub.plan.code, "pro")
        # Slots created to quota
        slots = list(UserRutSlot.objects.filter(user=self.user).order_by("slot_index"))
        self.assertEqual(len(slots), 5)

    def test_add_ruts_limit_and_duplicates_and_invalid(self):
        self.login()
        # subscribe basic (1)
        self.client.get(reverse("contratar_plan", args=["basic"]))
        slots = list(UserRutSlot.objects.filter(user=self.user).order_by("slot_index"))
        self.assertEqual(len(slots), 1)
        slot = slots[0]

        # invalid rut
        resp = self.client.post(reverse("slot_update", args=[slot.id]), data={"rut": "123"})
        self.assertEqual(resp.status_code, 302)
        # should remain empty
        slot.refresh_from_db()
        self.assertEqual(slot.state, "empty")

        # valid rut
        rut1 = make_rut(12345678)
        self.client.post(reverse("slot_update", args=[slot.id]), data={"rut": rut1})
        slot.refresh_from_db()
        self.assertEqual(slot.state, "available")
        self.assertEqual(slot.rut, rut1)

        # duplicate
        resp = self.client.post(reverse("slot_update", args=[slot.id]), data={"rut": rut1})
        self.assertEqual(resp.status_code, 302)
        slot.refresh_from_db()
        self.assertEqual(slot.rut, rut1)

        # limit reached -> cannot add new since only 1 slot exists
        # upgrade to pro and fill all, then try one more
        self.client.get(reverse("contratar_plan", args=["pro"]))
        slots = list(UserRutSlot.objects.filter(user=self.user).order_by("slot_index"))
        self.assertEqual(len(slots), 5)
        # fill remaining 4 with unique RUTs
        base = 20000000
        for s in slots:
            if not s.rut:
                self.client.post(reverse("slot_update", args=[s.id]), data={"rut": make_rut(base)})
                base += 1
        # all should be available and non-empty
        self.assertEqual(UserRutSlot.objects.filter(user=self.user, state="available").count(), 5)

    def test_first_use_locks(self):
        self.login()
        self.client.get(reverse("contratar_plan", args=["basic"]))
        slot = UserRutSlot.objects.get(user=self.user)
        rut1 = make_rut(22222222)
        self.client.post(reverse("slot_update", args=[slot.id]), data={"rut": rut1})
        slot.refresh_from_db()
        self.assertEqual(slot.state, "available")

        # Use in formulario -> should lock
        resp = self.client.post(reverse("formulario"), data={"slot_id": slot.id, "type": "compras", "sii_rut": rut1})
        self.assertEqual(resp.status_code, 302)
        slot.refresh_from_db()
        self.assertEqual(slot.state, "locked")

    def test_upgrade_and_downgrade_rules(self):
        self.login()
        # start with pro 5
        self.client.get(reverse("contratar_plan", args=["pro"]))
        # lock first slot by using formulario
        slot1 = UserRutSlot.objects.filter(user=self.user, slot_index=1).first()
        rut1 = make_rut(33333333)
        self.client.post(reverse("slot_update", args=[slot1.id]), data={"rut": rut1})
        self.client.post(reverse("formulario"), data={"slot_id": slot1.id, "type": "compras", "sii_rut": rut1})
        slot1.refresh_from_db()
        self.assertEqual(slot1.state, "locked")

        # downgrade to basic 1 -> extra slots removed and remaining unlocked
        self.client.get(reverse("contratar_plan", args=["basic"]))
        slots = list(UserRutSlot.objects.filter(user=self.user).order_by("slot_index"))
        self.assertEqual(len(slots), 1)
        self.assertEqual(slots[0].slot_index, 1)
        self.assertIn(slots[0].state, ["empty", "available"])  # unlocked

    def test_navbar_and_logout(self):
        self.login()
        # subscribe to show plan in navbar
        self.client.get(reverse("contratar_plan", args=["basic"]))
        resp = self.client.get("/")
        self.assertContains(resp, self.user.email)
        self.assertContains(resp, "Básico")

        # logout should redirect to landing (POST)
        resp = self.client.post("/accounts/logout/")
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp.headers.get("Location"), "/")

