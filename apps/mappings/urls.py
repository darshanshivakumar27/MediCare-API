from django.urls import path
from apps.mappings.views import MappingDetailView, MappingListCreateView

app_name = 'mappings'

urlpatterns = [
    path('mappings/', MappingListCreateView.as_view(), name='mapping-list-create'),
    path('mappings/<int:pk>/', MappingDetailView.as_view(), name='mapping-detail'),
]
