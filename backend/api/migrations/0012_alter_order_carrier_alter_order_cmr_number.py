# Generated by Django 5.1.7 on 2025-05-26 11:39

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0011_remove_order_notes_order_act_date_order_act_number_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="carrier",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="api.carrier",
                verbose_name="Перевозчик",
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="cmr_number",
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name="Номер CMR/коносамента"),
        ),
    ]
