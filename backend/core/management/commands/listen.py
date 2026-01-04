import asyncio
import json
import os
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3
from channels.db import database_sync_to_async
from core.models import CoffeeMemo
from datetime import datetime
from upstash_redis import Redis  # HTTP Based Redis

logger = logging.getLogger(__name__)

# --- UPSTASH HTTP CONNECTION ---
# Replace these with your actual details from the Upstash Console
# Usually, you'd put these in your .env as UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
r = Redis(
    url="https://immense-lionfish-20640.upstash.io", 
    token="AVCgAAIncDIwY2YzMGU0ZGFlYWI0ZmM2YTg3Y2MxMGI2NDdmMDgxMHAyMjA2NDA"
)

class Command(BaseCommand):
    help = "Listen for newMemo events via WebSockets with Auto-Reconnect"

    async def log_to_frontend(self, message, type="info"):
        """Publishes logs to Redis for the React Frontend Terminal via HTTP"""
        try:
            log_entry = json.dumps({
                "message": message, 
                "type": type, 
                "time": datetime.now().strftime("%H:%M:%S")
            })
            # upstash-redis uses standard commands
            r.publish("frontend_logs", log_entry)
            print(f"[{type.upper()}] {message}")
        except Exception as e:
            print(f"Upstash HTTP Error: {e}")

    async def save_memo(self, w3, args, event):
        """Processes blockchain data and saves to Django and Redis"""
        try:
            # Get the transaction to fetch the value sent
            tx_hash = event['transactionHash']
            tx = await w3.eth.get_transaction(tx_hash)
            wei_value = tx['value']

            # Convert Wei to ETH
            eth_value = float(AsyncWeb3.from_wei(wei_value, 'ether'))

            dt = datetime.fromtimestamp(args['timestamp'])

            # Save to Django Database
            memo, created = await database_sync_to_async(CoffeeMemo.objects.update_or_create)(
                memo_id=args['id'],
                defaults={
                    'sender_address': args['from'],
                    'name': args['name'],
                    'message': args['message'],
                    'timestamp': dt,
                    'eth_amount': eth_value
                }
            )

            if created:
                # Update Redis Real-time Stats via HTTP
                r.incrbyfloat("total_eth", eth_value)
                r.zincrby("leaderboard", eth_value, args['from'])

            return created
        except Exception as e:
            logger.error(f"Error in save_memo: {e}")
            return False

    async def log_loop(self, contract, poll_interval):
        """Polls for new blockchain entries"""
        event_filter = await contract.events.newMemo.create_filter(from_block='latest')
        
        while True:
            try:
                new_entries = await event_filter.get_new_entries()
                for event in new_entries:
                    if hasattr(event, 'args'):
                        created = await self.save_memo(event['args'], event)
                        if created:
                            await self.log_to_frontend(f"✅ New memo: {event['args']['name']}", "success")
            except Exception as e:
                event_filter = await contract.events.newMemo.create_filter(from_block='latest')
            
            await asyncio.sleep(poll_interval)

    async def handle_async(self):
        """Main connection handler with Alchemy WSS"""
        wss_url = f"wss://eth-sepolia.g.alchemy.com/v2/{settings.ALCHEMY_API_KEY}"
        
        with open("core/abi.json") as f:
            abi = json.load(f)["abi"]

        await self.log_to_frontend("📡 Indexer Starting (HTTP Redis Mode)...", "info")

        while True:
            try:
                async with AsyncWeb3(AsyncWeb3.WebSocketProvider(wss_url)) as w3:
                    if await w3.is_connected():
                        contract = w3.eth.contract(address=settings.CONTRACT_ADDRESS, abi=abi)
                        
                        await self.log_to_frontend("📜 Syncing historical data...", "info")
                        past_events = await contract.events.newMemo.get_logs(from_block='latest')
                        for event in past_events:
                            await self.save_memo(event['args'], event)
                        
                        await self.log_to_frontend("🚀 Connection Live! Watching for coffees...", "success")
                        await self.log_loop(contract, 2)
            except Exception as e:
                await self.log_to_frontend(f"❌ Connection error: {str(e)}", "error")
                await asyncio.sleep(5)

    def handle(self, *args, **options):
        try:
            asyncio.run(self.handle_async())
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS("🛑 Stopped."))