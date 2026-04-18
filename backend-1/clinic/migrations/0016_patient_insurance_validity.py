from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clinic', '0015_receptionist_is_admin'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='insurance_valid_from',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='insurance_valid_to',
            field=models.DateField(blank=True, null=True),
        ),
    ]
