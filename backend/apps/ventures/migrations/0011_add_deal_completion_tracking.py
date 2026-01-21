# Generated manually for deal completion tracking
# Migration: Add completion tracking fields to InvestmentCommitment

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventures', '0010_add_conversation_to_investment_commitment'),
    ]

    operations = [
        migrations.AddField(
            model_name='investmentcommitment',
            name='investor_completed_at',
            field=models.DateTimeField(
                blank=True,
                help_text='When investor marked the deal as completed (contracts signed, funds transferred, etc.)',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='investmentcommitment',
            name='venture_completed_at',
            field=models.DateTimeField(
                blank=True,
                help_text='When venture marked the deal as completed (contracts signed, funds received, etc.)',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='investmentcommitment',
            name='completed_at',
            field=models.DateTimeField(
                blank=True,
                help_text='When both parties completed the deal (automatically set when both complete)',
                null=True
            ),
        ),
    ]
