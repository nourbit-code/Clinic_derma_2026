from django.contrib import admin
from .models import *
from django.contrib.auth.models import User

admin.site.register(Patient)

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['doctor_id', 'name', 'specialty', 'email']
    search_fields = ['name', 'email', 'specialty']

@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    list_display = ['receptionist_id', 'name', 'email']
    search_fields = ['name', 'email']
admin.site.register(Service)
admin.site.register(Appointment)
admin.site.register(AppointmentService)
admin.site.register(Invoice)
admin.site.register(MedicalRecord)
admin.site.register(Medication)
admin.site.register(Prescription)
admin.site.register(PrescriptionMedication)
admin.site.register(TreatmentPlan)
admin.site.register(TreatmentSession)
admin.site.register(Allergy)
admin.site.register(PatientAllergy)
