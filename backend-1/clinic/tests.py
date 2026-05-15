from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Doctor, InsuranceCompany, InventoryItem, Patient, Receptionist


class LoginApiTests(APITestCase):
    def setUp(self):
        self.doctor = Doctor.objects.create(
            name="Dr Login",
            specialty="Dermatology",
            email="doctor@login.test",
            password="doc123",
        )
        self.reception_user = User.objects.create_user(
            username="reception1",
            email="reception@login.test",
            password="user-pass",
        )
        self.receptionist = Receptionist.objects.create(
            user=self.reception_user,
            name="Reception Login",
            email="reception@login.test",
            password="reception123",
            is_admin=True,
        )

    def test_login_doctor_success(self):
        response = self.client.post(
            "/api/login/",
            {"email": self.doctor.email, "password": self.doctor.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "doctor")
        self.assertEqual(response.data["user"]["email"], self.doctor.email)

    def test_login_receptionist_success(self):
        response = self.client.post(
            "/api/login/",
            {"email": self.receptionist.email, "password": self.receptionist.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "receptionist")
        self.assertTrue(response.data["user"]["is_admin"])

    def test_login_invalid_credentials(self):
        response = self.client.post(
            "/api/login/",
            {"email": "no-user@test.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", response.data)

    def test_login_requires_email_and_password(self):
        response = self.client.post("/api/login/", {"email": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class InvoiceInsuranceTests(APITestCase):
    def setUp(self):
        self.insurance = InsuranceCompany.objects.create(
            name="Test Insurance Co", discount_percent=Decimal("20.00")
        )

    def _create_patient(self, active=True):
        valid_from = date.today() - timedelta(days=10)
        valid_to = date.today() + timedelta(days=10) if active else date.today() - timedelta(days=1)
        return Patient.objects.create(
            name="Patient Insurance",
            age=31,
            gender="female",
            phone="01000000000",
            has_insurance=True,
            insurance_company=self.insurance,
            insurance_member_id="MEM-001",
            insurance_valid_from=valid_from,
            insurance_valid_to=valid_to,
        )

    def test_invoice_applies_active_insurance_coverage(self):
        patient = self._create_patient(active=True)

        response = self.client.post(
            "/api/invoices/",
            {
                "patient": patient.patient_id,
                "discount_amount": 0,
                "payment_method": "cash",
                "items": [
                    {"description": "Consultation", "quantity": 1, "unit_price": 500},
                    {"description": "Lab", "quantity": 1, "unit_price": 100},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["insurance_coverage"])), Decimal("20"))
        self.assertEqual(Decimal(str(response.data["subtotal"])), Decimal("600"))
        self.assertEqual(Decimal(str(response.data["insurance_amount"])), Decimal("120"))
        self.assertEqual(Decimal(str(response.data["total_amount"])), Decimal("480"))

    def test_invoice_skips_expired_insurance_coverage(self):
        patient = self._create_patient(active=False)

        response = self.client.post(
            "/api/invoices/",
            {
                "patient": patient.patient_id,
                "discount_amount": 0,
                "payment_method": "cash",
                "items": [{"description": "Consultation", "quantity": 1, "unit_price": 500}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data["insurance_coverage"])), Decimal("0"))
        self.assertEqual(response.data["insurance_provider"], "")
        self.assertEqual(Decimal(str(response.data["insurance_amount"])), Decimal("0"))
        self.assertEqual(Decimal(str(response.data["total_amount"])), Decimal("500"))


class InventoryStockTests(APITestCase):
    def setUp(self):
        self.item = InventoryItem.objects.create(
            name="Stock Test Item",
            category="consumable",
            quantity=2,
            unit="unit",
            min_stock_level=1,
            cost_per_unit=Decimal("10.00"),
        )

    def test_use_stock_returns_400_when_insufficient(self):
        response = self.client.post(
            f"/api/inventory/{self.item.item_id}/use_stock/",
            {"quantity": 3, "notes": "Should fail", "performed_by": "tester"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 2)

    def test_use_stock_deducts_quantity_when_available(self):
        response = self.client.post(
            f"/api/inventory/{self.item.item_id}/use_stock/",
            {"quantity": 1, "notes": "Valid use", "performed_by": "tester"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 1)
