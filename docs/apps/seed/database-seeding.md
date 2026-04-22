# Database Seeding

## Overview

This guide covers seeding the database with initial data.

## Seeding Workflow

### 1. Reset Database (Optional)

```bash
bun run db:reset:dev
```

⚠️ Destroys all data and recreates database.

### 2. Run Migrations

```bash
bun run db:migrate:dev
```

### 3. Seed Data

```bash
bun run db:seed:dev
```

## Seed Data Structure

```
data/
├── fixtures/
│   ├── users.json      # User accounts
│   ├── events.json     # Events
│   └── venues.json     # Venues
└── seed.ts             # Seed script
```

## Creating Seed Data

### JSON Format

```json
// data/fixtures/users.json
[
  {
    "email": "admin@mirai.app",
    "name": "Admin User",
    "role": "admin"
  },
  {
    "email": "user@mirai.app",
    "name": "Demo User",
    "role": "user"
  }
]
```

### CSV Format

```csv
// data/fixtures/events.csv
name,startDate,endDate,venueId
"Tech Conference",2024-01-15,2024-01-17,venue-1
"Music Festival",2024-02-20,2024-02-22,venue-2
```

### Seed Script

```typescript
// src/seed.ts
import { prisma } from '@mirai-app/db';
import users from '../data/fixtures/users.json';

export async function seed() {
  // Seed users
  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }
  
  console.log(`Seeded ${users.length} users`);
}

// Run if called directly
if (import.meta.main) {
  await seed();
}
```

## Environment-Specific Seeding

### Development

```bash
# Uses .env.dev
bun run --env-file=../../environment/.env.dev db:seed:dev
```

Seeds with:
- Demo users
- Test events
- Sample data

### Production

```bash
# Uses .env.prod
bun run --env-file=../../environment/.env.prod db:seed:prod
```

Seeds with:
- Admin account only
- Minimal essential data

## Incremental Seeding

### Check Before Creating

```typescript
async function seedUsers() {
  const existing = await prisma.user.count();
  
  if (existing > 0) {
    console.log('Users already exist, skipping...');
    return;
  }
  
  // Seed users
}
```

### Upsert Pattern

```typescript
await prisma.user.upsert({
  where: { email: 'admin@mirai.app' },
  update: {},
  create: {
    email: 'admin@mirai.app',
    name: 'Admin',
    role: 'admin',
  },
});
```

## Testing Seeds

### Dry Run

```bash
# Preview what would be seeded
bun run seed --dry-run
```

### Validation

```typescript
export async function validateSeed() {
  const userCount = await prisma.user.count();
  const eventCount = await prisma.event.count();
  
  console.log({
    users: userCount,
    events: eventCount,
  });
  
  if (userCount === 0) {
    throw new Error('No users seeded!');
  }
}
```

## Best Practices

1. **Use upsert** for idempotent seeds
2. **Validate data** before seeding
3. **Log progress** for visibility
4. **Separate dev/prod** seed data
5. **Don't commit secrets** in seed files

## Troubleshooting

### Foreign Key Errors

Ensure related data is seeded in order:

```typescript
await seedVenues();     // First
await seedEvents();     // References venues
await seedAttendees();  // References events
```

### Duplicate Data

Use unique constraints or upsert:

```typescript
await prisma.user.upsert({
  where: { email: user.email },
  update: {},
  create: user,
});
```

## Further Reading

- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)
