# Generated by Django 5.2.1 on 2025-06-05 01:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='etablissement',
            name='autorisation',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='etablissement', to='core.fichier'),
        ),
        migrations.AddField(
            model_name='fichier',
            name='mime_type',
            field=models.CharField(blank=True, max_length=60),
        ),
        migrations.AlterField(
            model_name='etablissement',
            name='validate',
            field=models.BooleanField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name='fichier',
            name='photo',
            field=models.BinaryField(blank=True, null=True),
        ),
    ]
