# Environment Variables

## Overview

Environment configuration is managed through files in the `environment/` folder. This document explains the environment structure and required variables.

## Environment File Structure

```
environment/
├── .env.dev              # Development environment
├── .env.dev.example      # Development template
├── .env.prod             # Production environment
└── .env.prod.example     # Production template
```

## Environment Files

### Development (.env.dev)

```bash
# Database
DATABASE_URL=postgresql://mirai:mirai@localhost:5432/mirai
DIRECT_URL=postgresql://mirai:mirai@localhost:5432/mirai

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend Server
PORT=3000
HOST=0.0.0.0

# Native App
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Production (.env.prod)

```bash
# Database (use connection pooler for serverless)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Native App
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

## Required Variables

### All Apps

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |

### Backend Server

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |

### Native App

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | API base URL | `http://localhost:3000` |

## Environment-Specific Behavior

### Development

- Detailed error messages
- Hot reload enabled
- Debug logging
- Local database connections

### Production

- Minimal error messages
- No hot reload
- Structured logging
- Connection pooling

## Using Environment Variables

### In Code

```typescript
// Server-side
const dbUrl = process.env.DATABASE_URL;

// Client-side (Native/Web)
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

### In Package.json Scripts

```json
{
  "scripts": {
    "dev": "bun --env-file=../../environment/.env.dev src/index.ts",
    "prod": "bun --env-file=../../environment/.env.prod src/index.ts"
  }
}
```

## Security Best Practices

1. **Never commit `.env` files**: Only commit `.env.example` templates
2. **Use different keys per environment**: Don't reuse production keys in dev
3. **Restrict service role key**: Only use on server-side, never expose to clients
4. **Rotate keys regularly**: Update Supabase keys periodically

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Copy the URL and keys from Settings > API
3. Add to your `.env.dev` and `.env.prod`

## Database Setup

### Local Development

Using Docker:

```bash
docker run -d \
  --name mirai-postgres \
  -e POSTGRES_USER=mirai \
  -e POSTGRES_PASSWORD=mirai \
  -e POSTGRES_DB=mirai \
  -p 5432:5432 \
  postgres:15
```

### Production

Use Supabase's managed PostgreSQL or your preferred hosting:

```bash
# Supabase connection string format
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## Troubleshooting

### "Environment variable not found"

1. Check the variable is defined in the correct `.env` file
2. Verify the `--env-file` path in your script
3. Restart the dev server after changing `.env` files

### Database connection errors

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check if database is running
docker ps | grep postgres
```
