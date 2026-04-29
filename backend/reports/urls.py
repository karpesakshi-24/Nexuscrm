from django.urls import path
from .views import DashboardStatsView, PipelineReportView, AgentPerformanceView

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('pipeline/', PipelineReportView.as_view(), name='pipeline_report'),
    path('agents/', AgentPerformanceView.as_view(), name='agent_performance'),
]
