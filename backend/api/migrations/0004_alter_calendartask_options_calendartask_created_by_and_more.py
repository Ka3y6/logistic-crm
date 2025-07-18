# Generated by Django 5.1.7 on 2025-04-26 20:59

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_calendartask"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="calendartask",
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Задача календаря",
                "verbose_name_plural": "Задачи календаря",
            },
        ),
        migrations.AddField(
            model_name="calendartask",
            name="created_by",
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="created_tasks",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Создатель",
            ),
        ),
        migrations.AlterField(
            model_name="calendartask",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="calendartask",
            name="order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="calendar_tasks",
                to="api.order",
                verbose_name="Заказ",
            ),
        ),
        migrations.AlterField(
            model_name="calendartask",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.DeleteModel(
            name="CalendarEvent",
        ),
    ]
