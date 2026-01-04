import redis

r = redis.Redis.from_url("rediss://default:AVCgAAIncDIwY2YzMGU0ZGFlYWI0ZmM2YTg3Y2MxMGI2NDdmMDgxMHAyMjA2NDA@immense-lionfish-20640.upstash.io:6379", ssl_cert_reqs=None)

try:
    r.ping()
    print("✅ Upstash Connection Successful!")
except Exception as e:
    print(f"❌ Connection Failed: {e}")