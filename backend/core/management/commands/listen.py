import asyncio
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3
from channels.db import database_sync_to_async
from core.models import CoffeeMemo
from datetime import datetime

class Command(BaseCommand):
    help = "Listen for newMemo events via WebSockets"

    @database_sync_to_async
    def save_memo(self, args):
        # Convert blockchain timestamp (seconds) to Python datetime
        dt = datetime.fromtimestamp(args['timestamp'])
        
        return CoffeeMemo.objects.get_or_create(
            memo_id=args['id'],
            defaults={
                'sender_address': args['from'],
                'name': args['name'],
                'message': args['message'],
                'timestamp': dt,
                'eth_amount': 0 # Optional: Fetch from tx receipt later
            }
        )

    async def log_loop(self, event_filter, poll_interval):
        while True:
            # Poll for new events over the WebSocket connection
            for event in await event_filter.get_new_entries():
                await self.save_memo(event['args'])
                print(f"✅ Indexed: {event['args']['name']}")
            await asyncio.sleep(poll_interval)

    async def handle_async(self):
        wss_url = f"wss://eth-sepolia.g.alchemy.com/v2/{settings.ALCHEMY_API_KEY}"
        
        # 1. Create the provider (just the object)
        provider = AsyncWeb3.WebSocketProvider(wss_url)
        
        # 2. Wrap it in AsyncWeb3 and use the context manager HERE
        async with AsyncWeb3(provider) as w3:
            # Load ABI
            with open("core/abi.json") as f:
                data = json.load(f)
                abi = data["abi"]

            contract = w3.eth.contract(address=settings.CONTRACT_ADDRESS, abi=abi)
            
            try:
                # 3. Create filter (ensure snake_case from_block)
                event_filter = await contract.events.newMemo.create_filter(from_block='latest')
                print(f"📡 Worker started. Watching contract: {settings.CONTRACT_ADDRESS}")
                
                # 4. Start the loop
                await self.log_loop(event_filter, 2)
                
            except Exception as e:
                print(f"❌ Error setting up filter: {e}")

    def handle(self, *args, **options):
        # Use asyncio.run to kick off the async logic from the sync Django command
        asyncio.run(self.handle_async())