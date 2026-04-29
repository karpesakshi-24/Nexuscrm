from django.contrib import admin
from .models import Task, CalendarEvent


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'assigned_to', 'due_date', 'created_at']
    list_filter = ['status', 'priority']
    search_fields = ['title', 'description']
    raw_id_fields = ['assigned_to', 'created_by', 'contact']


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'start_time', 'end_time', 'created_by']
    search_fields = ['title']
