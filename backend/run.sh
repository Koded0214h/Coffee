#!/bin/bash

# 1. Run Migrations
python manage.py makemigrations 

python manage.py migrate

# 2. Start the Blockchain Listener in the background
# The '&' sends it to the background so the script can continue
python manage.py listen &

# 3. Start the Django API (Production Server)
# We use 0.0.0.0:$PORT because Render provides the port dynamically
gunicorn backend.wsgi:application --bind 0.0.0.0:8000