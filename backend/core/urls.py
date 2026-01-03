from django.urls import path
from . import views

urlpatterns = [
    path("memos/", views.CoffeeListAPI.as_view(), name="coffee-list")
]
