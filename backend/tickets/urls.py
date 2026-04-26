from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'departments', views.DepartmentViewSet, basename='department')
router.register(r'units', views.UnitViewSet, basename='unit')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'intents', views.IntentViewSet, basename='intent')
router.register(r'reports', views.ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
    path('generate/', views.generate_tickets, name='generate_tickets'),
    path('distribute/', views.distribute_tickets, name='distribute_tickets'),
]
