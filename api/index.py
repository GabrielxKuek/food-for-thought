# Vercel serverless function wrapper for Flask app
from server.app import app

# Export the Flask app for Vercel
# Vercel will automatically handle this as a serverless function
def handler(request, context):
    return app(request, context)
