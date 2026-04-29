import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from contacts.models import Contact
from tasks.models import Task
from accounts.models import User
from pipeline.models import Deal, Pipeline

logger = logging.getLogger('crm')


class DashboardStatsView(APIView):
    def get(self, request):
        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

        total_contacts = Contact.objects.count()
        new_this_month = Contact.objects.filter(created_at__gte=this_month_start).count()
        new_last_month = Contact.objects.filter(
            created_at__gte=last_month_start, created_at__lt=this_month_start).count()

        contacts_by_status = list(
            Contact.objects.values('status').annotate(count=Count('id')).order_by('status')
        )
        contacts_by_source = list(
            Contact.objects.values('source').annotate(count=Count('id')).order_by('-count')
        )

        tasks_overview = {
            'total': Task.objects.count(),
            'todo': Task.objects.filter(status='todo').count(),
            'in_progress': Task.objects.filter(status='in_progress').count(),
            'done': Task.objects.filter(status='done').count(),
            'overdue': Task.objects.filter(
                due_date__lt=now, status__in=['todo', 'in_progress']).count(),
        }

        # Monthly contact growth (last 6 months)
        monthly_growth = []
        for i in range(5, -1, -1):
            month_start = (now - timedelta(days=30 * i)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (now - timedelta(days=30 * (i - 1))).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0) if i > 0 else now
            count = Contact.objects.filter(
                created_at__gte=month_start, created_at__lt=month_end).count()
            monthly_growth.append({'month': month_start.strftime('%b %Y'), 'count': count})

        agent_leaderboard = list(
            User.objects.filter(role='agent').annotate(
                contact_count=Count('assigned_contacts'),
                task_done=Count('assigned_tasks', filter=Q(assigned_tasks__status='done')),
                deals_won=Count('deals', filter=Q(deals__status='won')),
            ).values('id', 'first_name', 'last_name', 'contact_count', 'task_done', 'deals_won')
            .order_by('-contact_count')[:10]
        )

        return Response({
            'contacts': {
                'total': total_contacts,
                'new_this_month': new_this_month,
                'new_last_month': new_last_month,
                'growth_pct': round(
                    ((new_this_month - new_last_month) / new_last_month * 100)
                    if new_last_month else 0, 1),
                'by_status': contacts_by_status,
                'by_source': contacts_by_source,
                'monthly_growth': monthly_growth,
            },
            'tasks': tasks_overview,
            'agent_leaderboard': agent_leaderboard,
        })


class PipelineReportView(APIView):
    """Aggregated pipeline & deal analytics."""
    def get(self, request):
        now = timezone.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        open_deals = Deal.objects.filter(status='open')
        won_deals = Deal.objects.filter(status='won')
        lost_deals = Deal.objects.filter(status='lost')

        # Funnel by stage (across all pipelines)
        stage_funnel = list(
            Deal.objects.filter(status='open')
            .values('stage__name', 'stage__order', 'stage__color')
            .annotate(count=Count('id'), total_value=Sum('value'))
            .order_by('stage__order')
        )

        # Deals won this month
        won_this_month = won_deals.filter(closed_at__gte=this_month_start)

        # Lost reasons breakdown
        lost_reasons = list(
            lost_deals.exclude(lost_reason='')
            .values('lost_reason')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # Win rate
        closed_count = won_deals.count() + lost_deals.count()
        win_rate = round(won_deals.count() / closed_count * 100, 1) if closed_count else 0

        # Revenue by pipeline
        revenue_by_pipeline = list(
            Pipeline.objects.annotate(
                open_value=Sum('deals__value', filter=Q(deals__status='open')),
                won_value=Sum('deals__value', filter=Q(deals__status='won')),
                deal_count=Count('deals', filter=Q(deals__status='open')),
            ).values('name', 'open_value', 'won_value', 'deal_count')
        )

        # Monthly won value (last 6 months)
        monthly_revenue = []
        for i in range(5, -1, -1):
            ms = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            me = (now - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0) if i > 0 else now
            val = won_deals.filter(closed_at__gte=ms, closed_at__lt=me).aggregate(t=Sum('value'))['t'] or 0
            monthly_revenue.append({'month': ms.strftime('%b %Y'), 'value': float(val)})

        return Response({
            'summary': {
                'open_deals': open_deals.count(),
                'won_deals': won_deals.count(),
                'lost_deals': lost_deals.count(),
                'win_rate_pct': win_rate,
                'total_open_value': float(open_deals.aggregate(t=Sum('value'))['t'] or 0),
                'total_won_value': float(won_deals.aggregate(t=Sum('value'))['t'] or 0),
                'avg_deal_size': float(won_deals.aggregate(a=Avg('value'))['a'] or 0),
                'won_this_month': won_this_month.count(),
                'won_value_this_month': float(won_this_month.aggregate(t=Sum('value'))['t'] or 0),
            },
            'stage_funnel': stage_funnel,
            'lost_reasons': lost_reasons,
            'revenue_by_pipeline': revenue_by_pipeline,
            'monthly_revenue': monthly_revenue,
        })


class AgentPerformanceView(APIView):
    """Detailed per-agent performance metrics (manager+ only)."""
    def get(self, request):
        if not request.user.is_manager:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only managers can view agent performance.')

        agents = User.objects.filter(role__in=['agent', 'manager']).annotate(
            contacts_assigned=Count('assigned_contacts'),
            tasks_total=Count('assigned_tasks'),
            tasks_done=Count('assigned_tasks', filter=Q(assigned_tasks__status='done')),
            tasks_overdue=Count('assigned_tasks', filter=Q(
                assigned_tasks__status__in=['todo', 'in_progress'],
                assigned_tasks__due_date__lt=timezone.now()
            )),
            deals_open=Count('deals', filter=Q(deals__status='open')),
            deals_won=Count('deals', filter=Q(deals__status='won')),
            deals_won_value=Sum('deals__value', filter=Q(deals__status='won')),
        ).values(
            'id', 'first_name', 'last_name', 'username', 'role',
            'contacts_assigned', 'tasks_total', 'tasks_done', 'tasks_overdue',
            'deals_open', 'deals_won', 'deals_won_value',
        ).order_by('-deals_won_value')

        return Response(list(agents))
