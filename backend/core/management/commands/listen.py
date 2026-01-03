import asyncio
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3
from channels.db import database_sync_to_async
from core.models import CoffeeMemo
from datetime import datetime

class Command(BaseCommand):
    help = "Listen for newMemo events via WebSockets with Auto-Reconnect"

    @database_sync_to_async
    def save_memo(self, args):
        # Convert blockchain timestamp (seconds) to Python datetime
        dt = datetime.fromtimestamp(args['timestamp'])
        
        # We use update_or_create to prevent duplicates if the indexer restarts
        memo, created = CoffeeMemo.objects.update_or_create(
            memo_id=args['id'],
            defaults={
                'sender_address': args['from'],
                'name': args['name'],
                'message': args['message'],
                'timestamp': dt,
                'eth_amount': 0 
            }
        )
        return created

    async def log_loop(self, event_filter, poll_interval):
        """Polls the filter for new entries."""
        while True:
            for event in await event_filter.get_new_entries():
                created = await self.save_memo(event['args'])
                if created:
                    print(f"✅ Indexed New Coffee: {event['args']['name']}")
            await asyncio.sleep(poll_interval)

    async def handle_async(self):
        wss_url = f"wss://eth-sepolia.g.alchemy.com/v2/{settings.ALCHEMY_API_KEY}"
        
        # Load ABI once
        with open("core/abi.json") as f:
            data = json.load(f)
            abi = data["abi"]

        print(f"📡 Worker initialized. Target: {settings.CONTRACT_ADDRESS}")

        # RECONNECTION LOOP
        while True:
            try:
                print("🔗 Attempting to connect to Alchemy WebSocket...")
                async with AsyncWeb3(AsyncWeb3.WebSocketProvider(wss_url)) as w3:
                    contract = w3.eth.contract(address=settings.CONTRACT_ADDRESS, abi=abi)
                    
                    # Create filter for new events
                    # Change 'latest' to a block number (e.g. 6543210) if you want to re-index on restart
                    event_filter = await contract.events.newMemo.create_filter(from_block='latest')
                    
                    print(f"🚀 Connection Established! Watching for coffees...")
                    await self.log_loop(event_filter, 2)

            except Exception as e:
                print(f"⚠️ Connection dropped: {e}")
                print("🔄 Retrying in 5 seconds...")
                await asyncio.sleep(5)

    def handle(self, *args, **options):
        """Entry point for python manage.py listen"""
        try:
            asyncio.run(self.handle_async())
        except KeyboardInterrupt:
            print("🛑 Worker stopped manually.")