from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clinic', '0014_clinicschedule'),
    ]

    operations = [
        migrations.AddField(
            model_name='receptionist',
            name='is_admin',
            field=models.BooleanField(default=False),
        ),
    ]
