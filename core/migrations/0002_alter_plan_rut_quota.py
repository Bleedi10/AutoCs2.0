from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="plan",
            name="rut_quota",
            field=models.PositiveSmallIntegerField(),
        ),
    ]

