import logging
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Task, CalendarEvent
from .serializers import TaskSerializer, CalendarEventSerializer

logger = logging.getLogger('crm')


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'contact__first_name', 'contact__last_name',
                     'contact__email', 'contact__company']
    ordering_fields = ['due_date', 'priority', 'status', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related('assigned_to', 'created_by', 'contact')
        if not user.is_manager:
            qs = qs.filter(Q(assigned_to=user) | Q(created_by=user))

        params = self.request.query_params
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('priority'):
            qs = qs.filter(priority=params['priority'])
        if params.get('contact'):
            qs = qs.filter(contact_id=params['contact'])
        if params.get('assigned_to'):
            qs = qs.filter(assigned_to_id=params['assigned_to'])
        if params.get('due_before'):
            qs = qs.filter(due_date__lte=params['due_before'])
        if params.get('due_after'):
            qs = qs.filter(due_date__gte=params['due_after'])
        return qs

    def perform_create(self, serializer):
        task = serializer.save()
        # Trigger notification async
        try:
            from notifications.utils import notify_task_assigned
            notify_task_assigned(task)
        except Exception:
            pass

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = Task.Status.DONE
        task.completed_at = timezone.now()
        task.save()
        logger.info('Task %s completed by %s', task.pk, request.user.username)
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        task = self.get_object()
        task.status = Task.Status.TODO
        task.completed_at = None
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        qs = self.get_queryset().filter(
            due_date__lt=timezone.now(),
            status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
        )
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        qs = self.get_queryset().filter(due_date__date=today)
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Tasks due in the next 7 days."""
        now = timezone.now()
        qs = self.get_queryset().filter(
            due_date__gte=now,
            due_date__lte=now + __import__('datetime').timedelta(days=7),
            status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS],
        )
        return Response(TaskSerializer(qs, many=True).data)


class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer

    def get_queryset(self):
        user = self.request.user
        qs = CalendarEvent.objects.prefetch_related('attendees').select_related('contact', 'created_by')
        if not user.is_manager:
            qs = qs.filter(Q(created_by=user) | Q(attendees=user))
        params = self.request.query_params
        if params.get('start'):
            qs = qs.filter(start_time__gte=params['start'])
        if params.get('end'):
            qs = qs.filter(end_time__lte=params['end'])
        if params.get('contact'):
            qs = qs.filter(contact_id=params['contact'])
        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
