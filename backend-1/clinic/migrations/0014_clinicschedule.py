from django.db import migrations, models
import django.db.models.deletion
from datetime import time


class Migration(migrations.Migration):

    dependencies = [
        ('clinic', '0013_insurancecompany_patient_insurance'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClinicSchedule',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('open_days', models.JSONField(default=list)),
                ('open_time', models.TimeField(default=time(9, 0))),
                ('close_time', models.TimeField(default=time(17, 0))),
                ('slot_interval', models.PositiveIntegerField(default=30)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('doctor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='clinic_schedules', to='clinic.doctor')),
            ],
            options={
                'verbose_name': 'Clinic Schedule',
                'verbose_name_plural': 'Clinic Schedules',
            },
        ),
    ]
