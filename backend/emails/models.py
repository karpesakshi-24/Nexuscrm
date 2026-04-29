from django.db import models
from accounts.models import User
from contacts.models import Contact

class EmailTemplate(models.Model):
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=500)
    body = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class EmailThread(models.Model):
    subject = models.CharField(max_length=500)
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='email_threads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.subject

class EmailMessage(models.Model):
    class Direction(models.TextChoices):
        INBOUND = 'inbound', 'Inbound'
        OUTBOUND = 'outbound', 'Outbound'

    thread = models.ForeignKey(EmailThread, on_delete=models.CASCADE, related_name='messages')
    direction = models.CharField(max_length=10, choices=Direction.choices)
    from_email = models.EmailField()
    to_emails = models.JSONField(default=list)
    cc_emails = models.JSONField(default=list, blank=True)
    subject = models.CharField(max_length=500)
    body_text = models.TextField(blank=True)
    body_html = models.TextField(blank=True)
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='sent_emails')
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    message_id = models.CharField(max_length=500, blank=True, db_index=True)

    class Meta:
        ordering = ['sent_at']
