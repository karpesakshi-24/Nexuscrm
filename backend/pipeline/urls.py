from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pipelines', views.PipelineViewSet, basename='pipeline')
router.register(r'stages', views.StageViewSet, basename='stage')
router.register(r'deals', views.DealViewSet, basename='deal')

urlpatterns = [path('', include(router.urls))]
