from django.db import models
from accounts.models import User

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#3B82F6')

    def __str__(self):
        return self.name

class Contact(models.Model):
    class Status(models.TextChoices):
        LEAD = 'lead', 'Lead'
        PROSPECT = 'prospect', 'Prospect'
        CUSTOMER = 'customer', 'Customer'
        CHURNED = 'churned', 'Churned'

    class Source(models.TextChoices):
        WEBSITE = 'website', 'Website'
        REFERRAL = 'referral', 'Referral'
        COLD_CALL = 'cold_call', 'Cold Call'
        EMAIL = 'email', 'Email Campaign'
        SOCIAL = 'social', 'Social Media'
        OTHER = 'other', 'Other'

    # Basic info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    mobile = models.CharField(max_length=20, blank=True)

    # Company info
    company = models.CharField(max_length=200, blank=True)
    job_title = models.CharField(max_length=200, blank=True)
    website = models.URLField(blank=True)

    # CRM fields
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.LEAD)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.OTHER)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='assigned_contacts')
    tags = models.ManyToManyField(Tag, blank=True)

    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)

    notes = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='contacts/', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL,
                                    null=True, related_name='created_contacts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_to']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

class ActivityLog(models.Model):
    class ActivityType(models.TextChoices):
        NOTE = 'note', 'Note'
        CALL = 'call', 'Call'
        MEETING = 'meeting', 'Meeting'
        EMAIL = 'email', 'Email'
        STATUS_CHANGE = 'status_change', 'Status Change'

    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
