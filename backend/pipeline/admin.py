from django.contrib import admin
from .models import Pipeline, Stage, Deal, DealNote


class StageInline(admin.TabularInline):
    model = Stage
    extra = 1


@admin.register(Pipeline)
class PipelineAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_default', 'created_at']
    inlines = [StageInline]


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'currency', 'status', 'stage', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'pipeline']
    search_fields = ['title', 'contact__email']
    raw_id_fields = ['contact', 'assigned_to', 'stage']


@admin.register(DealNote)
class DealNoteAdmin(admin.ModelAdmin):
    list_display = ['deal', 'created_by', 'created_at']
