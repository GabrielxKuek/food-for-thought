# Environment Variables for Production

## Required Environment Variables in Vercel:

Add these in your Vercel project settings under "Environment Variables":

```
REACT_APP_API_URL=https://your-backend-api-url.com
```

## For Local Development:

Copy this file to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
REACT_APP_API_URL=http://localhost:8080
```

## Important Notes:

1. **Never commit `.env.local`** - It's in .gitignore
2. **Vercel automatically uses REACT_APP_* variables** during build
3. **Update the API URL** in Vercel dashboard to your deployed backend
4. **If no backend yet**, use mock/simulator mode in the app
