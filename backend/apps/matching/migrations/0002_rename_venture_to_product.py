# Generated migration to rename venture field to product

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('matching', '0001_initial'),
        ('ventures', '0002_auto_20260114_1601'),  # After ventures migration
    ]

    operations = [
        # Rename field from venture to product
        migrations.RenameField(
            model_name='match',
            old_name='venture',
            new_name='product',
        ),
        
        # Update index
        migrations.AlterIndexTogether(
            name='match',
            index_together=set(),
        ),
        migrations.RemoveIndex(
            model_name='match',
            name='matches_venture_3b2de4_idx',
        ),
        migrations.AddIndex(
            model_name='match',
            index=models.Index(fields=['product', 'target_type'], name='matches_product_target_idx'),
        ),
    ]
