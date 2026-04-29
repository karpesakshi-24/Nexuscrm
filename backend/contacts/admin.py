from django.contrib import admin
from .models import Contact, Tag, ActivityLog


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'color']


class ActivityLogInline(admin.TabularInline):
    model = ActivityLog
    extra = 0
    readonly_fields = ['created_at', 'user']


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'company', 'status', 'source', 'assigned_to', 'created_at']
    list_filter = ['status', 'source']
    search_fields = ['first_name', 'last_name', 'email', 'company']
    inlines = [ActivityLogInline]
    raw_id_fields = ['assigned_to', 'created_by']
