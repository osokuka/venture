# Generated manually for pitch deck access control system
# Migration for VL-823, VL-824, VL-825, VL-826, VL-828

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventures', '0004_remove_ventureproduct_problem_statement_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PitchDeckAccess',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('granted_at', models.DateTimeField(auto_now_add=True)),
                ('revoked_at', models.DateTimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True, help_text='False if access has been revoked')),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='access_permissions', to='ventures.venturedocument')),
                ('granted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='granted_pitch_deck_accesses', to=settings.AUTH_USER_MODEL)),
                ('investor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pitch_deck_accesses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'pitch_deck_access',
            },
        ),
        migrations.CreateModel(
            name='PitchDeckAccessEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('event_type', models.CharField(choices=[('VIEW', 'View'), ('DOWNLOAD', 'Download')], max_length=20)),
                ('accessed_at', models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='access_events', to='ventures.venturedocument')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pitch_deck_access_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'pitch_deck_access_events',
                'ordering': ['-accessed_at'],
            },
        ),
        migrations.CreateModel(
            name='PitchDeckRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('DENIED', 'Denied'), ('CANCELLED', 'Cancelled')], default='PENDING', max_length=20)),
                ('message', models.TextField(blank=True, help_text='Optional message from investor', null=True)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('responded_at', models.DateTimeField(blank=True, null=True)),
                ('response_message', models.TextField(blank=True, help_text='Optional response message from venture', null=True)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='requests', to='ventures.venturedocument')),
                ('investor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pitch_deck_requests', to=settings.AUTH_USER_MODEL)),
                ('responded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='responded_pitch_deck_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'pitch_deck_requests',
                'ordering': ['-requested_at'],
            },
        ),
        migrations.CreateModel(
            name='PitchDeckShare',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('message', models.TextField(blank=True, help_text='Optional message from venture', null=True)),
                ('shared_at', models.DateTimeField(auto_now_add=True)),
                ('viewed_at', models.DateTimeField(blank=True, help_text='When investor first viewed the shared pitch deck', null=True)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shares', to='ventures.venturedocument')),
                ('investor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shared_pitch_decks', to=settings.AUTH_USER_MODEL)),
                ('shared_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shared_pitch_deck_shares', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'pitch_deck_shares',
                'ordering': ['-shared_at'],
            },
        ),
        migrations.AddIndex(
            model_name='pitchdeckshare',
            index=models.Index(fields=['document', 'shared_at'], name='pitch_deck_share_doc_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckshare',
            index=models.Index(fields=['investor', 'shared_at'], name='pitch_deck_share_inv_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckrequest',
            index=models.Index(fields=['document', 'status'], name='pitch_deck_req_doc_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckrequest',
            index=models.Index(fields=['investor', 'status'], name='pitch_deck_req_inv_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckrequest',
            index=models.Index(fields=['status', 'requested_at'], name='pitch_deck_req_status_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckaccessevent',
            index=models.Index(fields=['document', 'accessed_at'], name='pitch_deck_event_doc_at_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckaccessevent',
            index=models.Index(fields=['user', 'accessed_at'], name='pitch_deck_event_user_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckaccessevent',
            index=models.Index(fields=['document', 'event_type'], name='pitch_deck_event_doc_type_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckaccess',
            index=models.Index(fields=['document', 'investor', 'is_active'], name='pitch_deck_access_doc_idx'),
        ),
        migrations.AddIndex(
            model_name='pitchdeckaccess',
            index=models.Index(fields=['investor', 'is_active'], name='pitch_deck_access_inv_idx'),
        ),
        migrations.AddConstraint(
            model_name='pitchdeckaccess',
            constraint=models.UniqueConstraint(fields=['document', 'investor'], name='pitch_deck_access_unique_document_investor'),
        ),
    ]
