import redis

from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings

from rest_framework import generics
from .models import CoffeeMemo
from .serializers import CoffeeMemoSerializer

# Create your views here.


class CoffeeListAPI(generics.ListAPIView):
    queryset = CoffeeMemo.objects.all().order_by('-timestamp')
    serializer_class = CoffeeMemoSerializer


def health_check(request):
    return JsonResponse({"status": "healthy"})

def get_stats(request):
    r = redis.Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        connection_pool_kwargs={"ssl_cert_reqs": None}
    )
    
    total_eth = r.get("total_eth") or 0
    # Get the top user from the sorted set
    top_user = r.zrevrange("leaderboard", 0, 0, withscores=True)
    
    return JsonResponse({
        "total_eth": float(total_eth),
        "top_supporter": top_user[0][0].decode() if top_user else "None",
        "top_amount": top_user[0][1] if top_user else 0
    })
    