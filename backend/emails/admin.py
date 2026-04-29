from django.contrib import admin
from .models import EmailTemplate, EmailThread, EmailMessage


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'created_by', 'created_at']
    search_fields = ['name', 'subject']


class EmailMessageInline(admin.TabularInline):
    model = EmailMessage
    extra = 0
    readonly_fields = ['sent_at', 'sent_by', 'direction']


@admin.register(EmailThread)
class EmailThreadAdmin(admin.ModelAdmin):
    list_display = ['subject', 'contact', 'updated_at']
    search_fields = ['subject']
    inlines = [EmailMessageInline]
