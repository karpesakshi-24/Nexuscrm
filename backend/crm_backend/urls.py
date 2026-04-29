from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

admin.site.site_header = "NexusCRM Admin"
admin.site.site_title = "NexusCRM"
admin.site.index_title = "Dashboard"

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth & Users
    path('api/auth/', include('accounts.urls')),

    # Core CRM
    path('api/contacts/', include('contacts.urls')),
    path('api/', include('tasks.urls')),
    path('api/emails/', include('emails.urls')),

    # New modules
    path('api/pipeline/', include('pipeline.urls')),
    path('api/notifications/', include('notifications.urls')),

    # Reports
    path('api/reports/', include('reports.urls')),

    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Serve React frontend for everything else
    re_path(r'^(?!api/|admin/|static/).*$', TemplateView.as_view(
        template_name='index.html'
    )),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)