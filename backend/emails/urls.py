from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.EmailTemplateViewSet, basename='emailtemplate')
router.register(r'threads', views.EmailThreadViewSet, basename='emailthread')

urlpatterns = [path('', include(router.urls))]
