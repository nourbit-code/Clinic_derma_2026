import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinical_backend.settings')
django.setup()

from clinic.models import MedicalCondition, SurgeryType, Allergy

# Add medical conditions
conditions = [
    'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 
    'Thyroid Disorder', 'Eczema', 'Psoriasis', 'Acne', 
    'Rosacea', 'Vitiligo', 'Arthritis', 'Migraine'
]

for c in conditions:
    MedicalCondition.objects.get_or_create(name=c)

# Add surgery types
surgeries = [
    'Appendectomy', 'Tonsillectomy', 'Cesarean Section', 
    'Skin Biopsy', 'Mole Removal', 'Laser Treatment', 
    'Dermabrasion', 'Chemical Peel', 'Botox Injection', 
    'Liposuction', 'Rhinoplasty', 'Cataract Surgery'
]

for s in surgeries:
    SurgeryType.objects.get_or_create(name=s)

# Add allergies
allergies_list = [
    'Penicillin', 'Aspirin', 'Ibuprofen', 'Sulfa Drugs', 
    'Latex', 'Peanuts', 'Shellfish', 'Egg', 'Milk', 
    'Dust', 'Pollen', 'Bee Stings'
]

for a in allergies_list:
    Allergy.objects.get_or_create(name=a)

print(f'✅ Added: {MedicalCondition.objects.count()} conditions, {SurgeryType.objects.count()} surgeries, {Allergy.objects.count()} allergies')
