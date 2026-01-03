from rest_framework import serializers
from .models import CoffeeMemo

class CoffeeMemoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoffeeMemo
        fields = '__all__'