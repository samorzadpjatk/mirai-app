# Supabase Client Setup

## Overview

This document covers the Supabase client configuration and usage patterns in the MIRAI project.

## Client Types

### Standard Client

```typescript
import { createClient } from '@mirai-app/supabase';

const supabase = createClient();
```

### Server Client (with service role)

```typescript
import { createClient } from '@mirai-app/supabase';

const supabase = createClient({
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Or with service role
const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## React Integration

### Setup Provider

```typescript
// App entry point
import { SupabaseProvider } from '@mirai-app/supabase/react';

function App() {
  return (
    <SupabaseProvider>
      <MyApp />
    </SupabaseProvider>
  );
}
```

### Using the Client

```typescript
import { useSupabase } from '@mirai-app/supabase/react';

function UserProfile() {
  const supabase = useSupabase();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .single();
      setUser(data);
    };
    
    fetchUser();
  }, [supabase]);
  
  return <div>{user?.name}</div>;
}
```

### Auth State Changes

```typescript
import { useEffect } from 'react';
import { useSupabase } from '@mirai-app/supabase/react';

function AuthListener() {
  const supabase = useSupabase();
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          // Handle sign in
        }
        if (event === 'SIGNED_OUT') {
          // Handle sign out
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [supabase]);
  
  return null;
}
```

## Database Types

### Generated Types

```typescript
import { Database } from '@mirai-app/supabase/types';

// Use in client creation
const supabase = createClient<Database>();
```

### Type-Safe Queries

```typescript
// Fully typed query
const { data } = await supabase
  .from('users')
  .select('id, email, profile(*)')
  .eq('id', userId)
  .single();

// data is typed as User | null
```

## Query Patterns

### Basic CRUD

```typescript
// Create
const { data } = await supabase
  .from('users')
  .insert({ email: 'user@example.com', name: 'John' })
  .select()
  .single();

// Read
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Update
const { data } = await supabase
  .from('users')
  .update({ name: 'Jane' })
  .eq('id', userId)
  .select()
  .single();

// Delete
await supabase
  .from('users')
  .delete()
  .eq('id', userId);
```

### Relations

```typescript
// Include related data
const { data } = await supabase
  .from('users')
  .select(`
    id,
    email,
    profile:profiles(*),
    posts:posts(*)
  `)
  .eq('id', userId)
  .single();
```

### Realtime

```typescript
// Subscribe to changes
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'users' },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

## Best Practices

1. **Always use typed client** for type safety
2. **Handle errors** from all Supabase calls
3. **Use React Query or similar** for caching and state management
4. **Unsubscribe from realtime** when components unmount
5. **Use RLS policies** for security

## Error Handling

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*');

if (error) {
  console.error('Query failed:', error.message);
  // Handle error appropriately
}
```

## Environment Setup

Required environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server only
```

## Further Reading

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
