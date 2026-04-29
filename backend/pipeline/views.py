import logging
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from .models import Pipeline, Stage, Deal, DealNote
from .serializers import (PipelineSerializer, StageSerializer,
                           DealSerializer, DealListSerializer, DealNoteSerializer)
from accounts.permissions import IsManagerOrAbove

logger = logging.getLogger('crm')


class PipelineViewSet(viewsets.ModelViewSet):
    serializer_class = PipelineSerializer
    permission_classes_by_action = {}

    def get_queryset(self):
        return Pipeline.objects.annotate(
            deal_count=Count('deals', filter=Q(deals__status='open')),
            total_value=Sum('deals__value', filter=Q(deals__status='open')),
        ).prefetch_related('stages')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def kanban(self, request, pk=None):
        """Return pipeline in kanban board format."""
        pipeline = self.get_object()
        user = request.user
        stages = pipeline.stages.all()
        data = []
        for stage in stages:
            deals_qs = Deal.objects.filter(stage=stage, status=Deal.Status.OPEN)
            if not user.is_manager:
                deals_qs = deals_qs.filter(
                    Q(assigned_to=user) | Q(created_by=user)
                )
            deals_qs = deals_qs.select_related('contact', 'assigned_to')
            data.append({
                'stage': StageSerializer(stage).data,
                'deals': DealListSerializer(deals_qs, many=True).data,
                'count': deals_qs.count(),
                'total_value': deals_qs.aggregate(total=Sum('value'))['total'] or 0,
            })
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove])
    def add_stage(self, request, pk=None):
        pipeline = self.get_object()
        serializer = StageSerializer(data={**request.data, 'pipeline': pipeline.pk})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


class StageViewSet(viewsets.ModelViewSet):
    queryset = Stage.objects.annotate(
        deal_count=Count('deals', filter=Q(deals__status='open')),
        total_value=Sum('deals__value', filter=Q(deals__status='open')),
    )
    serializer_class = StageSerializer
    permission_classes = [IsManagerOrAbove]

    def get_queryset(self):
        qs = super().get_queryset()
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            qs = qs.filter(pipeline_id=pipeline_id)
        return qs


class DealViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'contact__first_name', 'contact__last_name']
    ordering_fields = ['created_at', 'value', 'expected_close_date', 'priority']

    def get_serializer_class(self):
        if self.action == 'list':
            return DealListSerializer
        return DealSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Deal.objects.select_related('pipeline', 'stage', 'contact', 'assigned_to', 'created_by')

        if not user.is_manager:
            qs = qs.filter(Q(assigned_to=user) | Q(created_by=user))

        # Filters
        params = self.request.query_params
        if params.get('pipeline'):
            qs = qs.filter(pipeline_id=params['pipeline'])
        if params.get('stage'):
            qs = qs.filter(stage_id=params['stage'])
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('priority'):
            qs = qs.filter(priority=params['priority'])
        if params.get('assigned_to'):
            qs = qs.filter(assigned_to_id=params['assigned_to'])
        if params.get('contact'):
            qs = qs.filter(contact_id=params['contact'])

        return qs

    @action(detail=True, methods=['post'])
    def move_stage(self, request, pk=None):
        """Move a deal to another stage."""
        deal = self.get_object()
        stage_id = request.data.get('stage_id')
        try:
            stage = Stage.objects.get(pk=stage_id, pipeline=deal.pipeline)
            deal.stage = stage
            deal.save(update_fields=['stage', 'updated_at'])
            logger.info('Deal %s moved to stage %s', deal.pk, stage.name)
            return Response(DealSerializer(deal, context={'request': request}).data)
        except Stage.DoesNotExist:
            return Response({'error': 'Stage not found in this pipeline'}, status=400)

    @action(detail=True, methods=['post'])
    def mark_won(self, request, pk=None):
        deal = self.get_object()
        deal.status = Deal.Status.WON
        deal.closed_at = timezone.now()
        deal.save()
        logger.info('Deal %s marked WON by %s', deal.pk, request.user.username)
        return Response(DealSerializer(deal, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def mark_lost(self, request, pk=None):
        deal = self.get_object()
        deal.status = Deal.Status.LOST
        deal.lost_reason = request.data.get('lost_reason', '')
        deal.closed_at = timezone.now()
        deal.save()
        logger.info('Deal %s marked LOST by %s', deal.pk, request.user.username)
        return Response(DealSerializer(deal, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        deal = self.get_object()
        serializer = DealNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(deal=deal, created_by=request.user)
        return Response(serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Aggregated summary of deals for the current user."""
        qs = self.get_queryset()
        from django.db.models import Avg
        data = {
            'open': qs.filter(status='open').count(),
            'won': qs.filter(status='won').count(),
            'lost': qs.filter(status='lost').count(),
            'total_open_value': qs.filter(status='open').aggregate(t=Sum('value'))['t'] or 0,
            'total_won_value': qs.filter(status='won').aggregate(t=Sum('value'))['t'] or 0,
            'avg_deal_value': qs.filter(status='won').aggregate(a=Avg('value'))['a'] or 0,
        }
        return Response(data)
