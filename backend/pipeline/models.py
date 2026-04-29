from django.db import models
from django.core.validators import MinValueValidator
from accounts.models import User
from contacts.models import Contact


class Pipeline(models.Model):
    """A sales pipeline (e.g., 'Enterprise Sales', 'SMB', 'Renewals')."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return self.name


class Stage(models.Model):
    """An ordered stage within a pipeline."""
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=7, default='#3B82F6')
    probability = models.PositiveIntegerField(default=0, help_text='Win probability % at this stage')

    class Meta:
        ordering = ['pipeline', 'order']
        unique_together = [['pipeline', 'name']]

    def __str__(self):
        return f"{self.pipeline.name} → {self.name}"


class Deal(models.Model):
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        WON = 'won', 'Won'
        LOST = 'lost', 'Lost'

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    value = models.DecimalField(max_digits=14, decimal_places=2, default=0,
                                 validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='INR')
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)

    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='deals')
    stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True, related_name='deals')
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='deals')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='deals')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                    related_name='created_deals')

    expected_close_date = models.DateField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    lost_reason = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'pipeline']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def __str__(self):
        return f"{self.title} (₹{self.value})"


class DealNote(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on {self.deal.title}"
