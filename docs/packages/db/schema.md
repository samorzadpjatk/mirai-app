# Schema Design Conventions

## Overview

Conventions and best practices for designing the Prisma schema.

## Naming Conventions

### Models

- **PascalCase, singular**: `User`, `Post`, `Event`
- **Avoid abbreviations**: `User` not `Usr`

### Fields

- **camelCase**: `firstName`, `createdAt`
- **Boolean**: prefix with verb `is`, `has`, `can`: `isActive`, `hasProfile`
- **Timestamps**: `createdAt`, `updatedAt`

### Relations

- **Model name in field**: `author` (User), `posts` (Post[])
- **Explicit relation names** when ambiguous:
  ```prisma
  writtenPosts Post[] @relation("WrittenPosts")
  favoritedPosts Post[] @relation("FavoritedPosts")
  ```

## Schema Structure

### Model Template

```prisma
model User {
  // Primary key
  id        String   @id @default(uuid())
  
  // Required fields
  email     String   @unique
  
  // Optional fields
  name      String?
  
  // Relations
  profile   Profile?
  posts     Post[]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Indexes
  @@index([email])
  @@index([createdAt])
}
```

### Field Ordering

1. Primary key (`id`)
2. Required fields
3. Optional fields
4. Relations
5. Timestamps (`createdAt`, `updatedAt`)
6. Indexes

## Data Types

### IDs

```prisma
// UUID (recommended for most cases)
id String @id @default(uuid())

// Auto-increment (for internal/sequential data)
id Int @id @default(autoincrement())

// CUID (alternative to UUID)
id String @id @default(cuid())
```

### Strings

```prisma
// Short text
name String

// Long text
description String? // or @db.Text for very long

// Enforced limits
slug String @db.VarChar(100)
```

### Dates

```prisma
// Always use DateTime
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
expiresAt DateTime?
```

### Booleans

```prisma
// Always default boolean values
isActive Boolean @default(true)
isAdmin  Boolean @default(false)
```

## Relations

### One-to-One

```prisma
model User {
  id      String  @id @default(uuid())
  profile Profile?
}

model Profile {
  id     String @id @default(uuid())
  user   User   @relation(fields: [userId], references: [id])
  userId String @unique
}
```

### One-to-Many

```prisma
model User {
  id    String @id @default(uuid())
  posts Post[]
}

model Post {
  id       String @id @default(uuid())
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

### Many-to-Many

```prisma
model Post {
  id    String @id @default(uuid())
  tags  Tag[]
}

model Tag {
  id    String @id @default(uuid())
  posts Post[]
}
```

## Indexes

### When to Add Indexes

- **Foreign keys**: Always index relation fields
- **Search fields**: Index fields used in WHERE clauses
- **Unique constraints**: Use @unique

```prisma
model Post {
  id        String   @id @default(uuid())
  authorId  String
  slug      String   @unique
  status    String
  createdAt DateTime @default(now())
  
  // Foreign key index (auto-created by Prisma)
  
  // Custom indexes
  @@index([status, createdAt])  // For filtered lists
  @@index([authorId, status])   // For user's posts
}
```

## Constraints

### Unique Constraints

```prisma
// Single field
email String @unique

// Multiple fields (composite)
@@unique([organizationId, email])
```

### Check Constraints (PostgreSQL)

```prisma
// Using @db extension
db Score {
  value Int @db.SmallInt
  
  @@ignore // Custom check in migration
}
```

## Soft Deletes

Pattern for soft deletion:

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

Query with filter:
```typescript
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});
```

## Schema Documentation

Add comments for clarity:

```prisma
/// User account in the system
model User {
  /// Unique identifier (UUID)
  id String @id @default(uuid())
  
  /// Email address used for login
  email String @unique
}
```

## Best Practices

1. **Use UUIDs** for external-facing IDs
2. **Always include timestamps** (createdAt, updatedAt)
3. **Index foreign keys** and frequently queried fields
4. **Use @map** for database naming conventions:
   ```prisma
   createdAt DateTime @default(now()) @map("created_at")
   ```
5. **Keep relations explicit** with @relation attributes
6. **Validate at application layer** even with schema constraints
