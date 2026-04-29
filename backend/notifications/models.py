from django.db import models
from accounts.models import User


class Notification(models.Model):
    class Type(models.TextChoices):
        TASK_ASSIGNED = 'task_assigned', 'Task Assigned'
        TASK_DUE = 'task_due', 'Task Due Soon'
        TASK_OVERDUE = 'task_overdue', 'Task Overdue'
        DEAL_WON = 'deal_won', 'Deal Won'
        DEAL_LOST = 'deal_lost', 'Deal Lost'
        CONTACT_ASSIGNED = 'contact_assigned', 'Contact Assigned'
        EMAIL_RECEIVED = 'email_received', 'Email Received'
        MENTION = 'mention', 'Mention'
        SYSTEM = 'system', 'System'

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=Type.choices, default=Type.SYSTEM)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Optional link to the object
    link = models.CharField(max_length=500, blank=True, help_text='Frontend route, e.g. /tasks/42')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient.username}"
