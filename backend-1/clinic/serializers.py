from rest_framework import serializers
from .models import (
    Patient, Doctor, Receptionist, Service, Appointment, AppointmentService,
    Invoice, InvoiceItem, MedicalRecord, Medication, Prescription, PrescriptionMedication,
    TreatmentPlan, TreatmentSession, Allergy, PatientAllergy, InventoryItem, StockTransaction,
    LaserSession, MedicalCondition, PatientMedicalCondition, SurgeryType, PatientSurgery
)
from django.contrib.auth.models import User

# Minimal user serializer for receptionist creation
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'


class ReceptionistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Receptionist
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class AppointmentServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), source='service', write_only=True)

    class Meta:
        model = AppointmentService
        fields = ['id', 'appointment', 'service', 'service_id', 'appo_cost']


class AppointmentSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'


class InvoiceItemSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = ['item_id', 'invoice', 'description', 'quantity', 'unit_price', 'amount']
        read_only_fields = ['item_id', 'amount']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    patient_age = serializers.IntegerField(source='patient.age', read_only=True)
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'


class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = '__all__'


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'


class PrescriptionMedicationSerializer(serializers.ModelSerializer):
    medication = MedicationSerializer(read_only=True)
    medication_id = serializers.PrimaryKeyRelatedField(queryset=Medication.objects.all(), source='medication', write_only=True)

    class Meta:
        model = PrescriptionMedication
        fields = ['id', 'prescription', 'medication', 'medication_id', 'dosage', 'duration_days', 'notes']


class PrescriptionSerializer(serializers.ModelSerializer):
    medications = PrescriptionMedicationSerializer(source='prescriptionmedication_set', many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'


class TreatmentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentPlan
        fields = '__all__'


class TreatmentSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentSession
        fields = '__all__'


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = '__all__'


class PatientAllergySerializer(serializers.ModelSerializer):
    allergy = AllergySerializer(read_only=True)
    allergy_id = serializers.PrimaryKeyRelatedField(queryset=Allergy.objects.all(), source='allergy', write_only=True)

    class Meta:
        model = PatientAllergy
        fields = '__all__'


class MedicalConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalCondition
        fields = '__all__'


class PatientMedicalConditionSerializer(serializers.ModelSerializer):
    condition = MedicalConditionSerializer(read_only=True)
    condition_id = serializers.PrimaryKeyRelatedField(queryset=MedicalCondition.objects.all(), source='condition', write_only=True)

    class Meta:
        model = PatientMedicalCondition
        fields = '__all__'


class SurgeryTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurgeryType
        fields = '__all__'


class PatientSurgerySerializer(serializers.ModelSerializer):
    surgery = SurgeryTypeSerializer(read_only=True)
    surgery_id = serializers.PrimaryKeyRelatedField(queryset=SurgeryType.objects.all(), source='surgery', write_only=True)

    class Meta:
        model = PatientSurgery
        fields = '__all__'


# -------------------------
# Inventory Serializers
# -------------------------
class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'item_id', 'name', 'category', 'category_display', 'quantity', 
            'unit', 'unit_display', 'supplier', 'expiry_date', 'linked_service',
            'min_stock_level', 'cost_per_unit', 'is_low_stock', 'is_expiring_soon',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['item_id', 'created_at', 'updated_at']


class StockTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = StockTransaction
        fields = ['transaction_id', 'item', 'item_name', 'transaction_type', 'quantity', 'notes', 'performed_by', 'created_at']
        read_only_fields = ['transaction_id', 'created_at']


# -------------------------
# Laser Session Serializer
# -------------------------
class LaserSessionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    skin_type_display = serializers.CharField(source='get_skin_type_display', read_only=True)
    intensity_display = serializers.CharField(source='get_intensity_display', read_only=True)
    
    class Meta:
        model = LaserSession
        fields = [
            'session_id', 'patient', 'patient_name', 'doctor', 'doctor_name', 
            'medical_record', 'treatment_area', 'skin_type', 'skin_type_display',
            'intensity', 'intensity_display', 'passes', 'notes', 
            'post_care_instructions', 'consumables_used',
            'session_date', 'created_at'
        ]
        read_only_fields = ['session_id', 'session_date', 'created_at']
