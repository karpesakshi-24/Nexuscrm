from django.db import models
from accounts.models import User
from contacts.models import Contact

class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DONE = 'done', 'Done'
        CANCELLED = 'cancelled', 'Cancelled'

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.TODO)

    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='assigned_tasks')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL,
                                    null=True, related_name='created_tasks')
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='tasks')

    due_date = models.DateTimeField(null=True, blank=True)
    reminder_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', '-priority']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return self.title

class CalendarEvent(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=300, blank=True)
    is_all_day = models.BooleanField(default=False)
    attendees = models.ManyToManyField(User, blank=True, related_name='events')
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='events')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL,
                                    null=True, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return self.title
