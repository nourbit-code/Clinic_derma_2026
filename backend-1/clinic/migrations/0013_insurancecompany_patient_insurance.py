from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('clinic', '0012_medicalrecord_location_ids_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='InsuranceCompany',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True)),
                ('discount_percent', models.DecimalField(decimal_places=2, default=0.0, max_digits=5)),
            ],
        ),
        migrations.AddField(
            model_name='patient',
            name='has_insurance',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='patient',
            name='insurance_company',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='patients', to='clinic.insurancecompany'),
        ),
        migrations.AddField(
            model_name='patient',
            name='insurance_member_id',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
