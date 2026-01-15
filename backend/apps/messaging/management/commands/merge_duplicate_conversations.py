"""
Management command to merge duplicate conversations between the same two users.

This command finds all conversations that have the same two participants and merges them
into a single conversation, moving all messages to the oldest conversation.
"""
from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from apps.messaging.models import Conversation, Message
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Merge duplicate conversations between the same two users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be merged without actually merging',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Find all conversations with exactly 2 participants
        conversations = Conversation.objects.annotate(
            participant_count=Count('participants')
        ).filter(participant_count=2)
        
        # Group conversations by their participants
        conversation_groups = {}
        merged_count = 0
        messages_moved = 0
        
        for conv in conversations:
            participants = list(conv.participants.all().order_by('id'))
            if len(participants) == 2:
                # Create a unique key for this pair of users (sorted by ID to ensure consistency)
                key = tuple(sorted([str(p.id) for p in participants]))
                
                if key not in conversation_groups:
                    conversation_groups[key] = []
                conversation_groups[key].append(conv)
        
        # Process each group
        for key, convs in conversation_groups.items():
            if len(convs) > 1:
                # Sort by created_at to keep the oldest conversation
                convs_sorted = sorted(convs, key=lambda c: c.created_at)
                keep_conv = convs_sorted[0]
                merge_convs = convs_sorted[1:]
                
                self.stdout.write(
                    f'\nFound {len(convs)} conversations between users {key[0]} and {key[1]}'
                )
                self.stdout.write(f'  Keeping: {keep_conv.id} (created: {keep_conv.created_at})')
                
                for merge_conv in merge_convs:
                    self.stdout.write(f'  Merging: {merge_conv.id} (created: {merge_conv.created_at})')
                    
                    if not dry_run:
                        # Move all messages from merge_conv to keep_conv
                        messages = Message.objects.filter(conversation=merge_conv)
                        message_count = messages.count()
                        messages.update(conversation=keep_conv)
                        messages_moved += message_count
                        
                        # Update last_message_at if merge_conv has a more recent message
                        if merge_conv.last_message_at:
                            if not keep_conv.last_message_at or merge_conv.last_message_at > keep_conv.last_message_at:
                                keep_conv.last_message_at = merge_conv.last_message_at
                                keep_conv.save(update_fields=['last_message_at'])
                        
                        # Delete the duplicate conversation
                        merge_conv.delete()
                    
                    merged_count += 1
        
        if merged_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n{"Would merge" if dry_run else "Merged"} {merged_count} duplicate conversations'
                )
            )
            if not dry_run:
                self.stdout.write(
                    self.style.SUCCESS(f'Moved {messages_moved} messages to merged conversations')
                )
        else:
            self.stdout.write(self.style.SUCCESS('No duplicate conversations found'))
