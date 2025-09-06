from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Rutas de tu app
    path("", include("core.urls")),

    # Django-Allauth (login/OAuth)
    path("accounts/", include("allauth.urls")),

    # Aliases cómodos: /login y /logout apuntan a allauth
    path("login/", RedirectView.as_view(pattern_name="account_login", permanent=False), name="login"),
    path("logout/", RedirectView.as_view(pattern_name="account_logout", permanent=False), name="logout"),
]

# Archivos de media en modo DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
