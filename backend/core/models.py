from django.db import models

# Create your models here.

class CoffeeMemo(models.Model):
    memo_id = models.IntegerField(unique=True)
    sender_address = models.CharField(max_length=42)
    name = models.CharField(max_length=255)
    message = models.TextField()
    timestamp = models.DateTimeField()
    eth_amount = models.DecimalField(max_digits=20, decimal_places=18)

    def __str__(self):
        return f"{self.name} - {self.memo_id}"