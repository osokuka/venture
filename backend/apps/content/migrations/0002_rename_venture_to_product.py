# Generated migration to rename venture field to product

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0001_initial'),
        ('ventures', '0002_auto_20260114_1601'),  # After ventures migration
    ]

    operations = [
        # Rename field from venture to product
        migrations.RenameField(
            model_name='successstory',
            old_name='venture',
            new_name='product',
        ),
    ]
