from django.shortcuts import render
from django.http import JsonResponse

from rest_framework import generics
from .models import CoffeeMemo
from .serializers import CoffeeMemoSerializer

# Create your views here.


class CoffeeListAPI(generics.ListAPIView):
    queryset = CoffeeMemo.objects.all().order_by('-timestamp')
    serializer_class = CoffeeMemoSerializer


def health_check(request):
    return JsonResponse({"status": "healthy"})

    