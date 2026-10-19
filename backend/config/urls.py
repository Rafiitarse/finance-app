"""
URL configuration for finance project.
"""
import os

from django.contrib import admin
from django.conf import settings
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Apps
    path('api/auth/', include('core.urls')),
    path('api/', include('transactions.urls')),
]

# API documentation is only exposed in development or when explicitly enabled.
if settings.DEBUG or os.getenv('ENABLE_API_DOCS') == '1':
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]
