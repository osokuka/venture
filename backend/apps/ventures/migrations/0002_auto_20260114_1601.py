# Generated migration for multi-product architecture

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ventures', '0001_initial'),
    ]

    operations = [
        # Step 1: Rename VentureProfile to VentureProduct
        migrations.RenameModel(
            old_name='VentureProfile',
            new_name='VentureProduct',
        ),
        
        # Step 2: Change OneToOneField to ForeignKey
        migrations.AlterField(
            model_name='ventureproduct',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
                to='accounts.user'
            ),
        ),
        
        # Step 3: Add is_active field
        migrations.AddField(
            model_name='ventureproduct',
            name='is_active',
            field=models.BooleanField(default=True, help_text='User can toggle this. Only active products appear in public listings.'),
        ),
        
        # Step 4: Rename table
        migrations.AlterModelTable(
            name='ventureproduct',
            table='venture_products',
        ),
        
        # Step 5: Update Founder model foreign key
        migrations.RenameField(
            model_name='founder',
            old_name='venture',
            new_name='product',
        ),
        
        # Step 6: Update TeamMember model foreign key
        migrations.RenameField(
            model_name='teammember',
            old_name='venture',
            new_name='product',
        ),
        
        # Step 7: Update VentureNeed model foreign key
        migrations.RenameField(
            model_name='ventureneed',
            old_name='venture',
            new_name='product',
        ),
        
        # Step 8: Update VentureDocument model foreign key
        migrations.RenameField(
            model_name='venturedocument',
            old_name='venture',
            new_name='product',
        ),
        
        # Step 9: Add indexes
        migrations.AddIndex(
            model_name='ventureproduct',
            index=models.Index(fields=['user', 'status'], name='venture_pro_user_sta_idx'),
        ),
        migrations.AddIndex(
            model_name='ventureproduct',
            index=models.Index(fields=['user', 'is_active'], name='venture_pro_user_act_idx'),
        ),
    ]
