# State Management

## Overview

The native app uses a combination of **Zustand** and **Jotai** for state management, along with **React Query** for server state.

## State Categories

| Category | Tool | Use Case |
|----------|------|----------|
| Server State | React Query | API data, caching |
| Global UI State | Zustand | Auth, theme, navigation state |
| Local Component State | useState | Form inputs, UI toggles |
| Derived State | Jotai | Computed values, filtered lists |

## Zustand Stores

### Auth Store

```typescript
// src/stores/auth.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### Theme Store

```typescript
// src/stores/theme.ts
interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));
```

### Usage

```typescript
import { useAuthStore } from '@/stores/auth';

function ProfileScreen() {
  const { user, logout } = useAuthStore();
  
  return (
    <View>
      <Text>{user?.name}</Text>
      <Button onPress={logout} title="Logout" />
    </View>
  );
}
```

## React Query (Server State)

### Setup Provider

```typescript
// app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
```

### Using Queries

```typescript
import { orpc } from '@mirai-app/orpc/client';

function EventList() {
  const { data, isLoading, error } = orpc.event.list.useQuery();
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <FlatList data={data} renderItem={...} />;
}
```

### Mutations

```typescript
function CreateEventForm() {
  const utils = orpc.useUtils();
  const create = orpc.event.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.event.list.invalidate();
    },
  });
  
  const onSubmit = (data) => {
    create.mutate(data);
  };
  
  return (
    <Form onSubmit={onSubmit}>
      <Button 
        title="Create" 
        onPress={onSubmit}
        disabled={create.isPending}
      />
    </Form>
  );
}
```

## Jotai (Atomic State)

### Atoms

```typescript
// src/atoms/filters.ts
import { atom } from 'jotai';

export const searchQueryAtom = atom('');
export const categoryFilterAtom = atom<string | null>(null);

// Derived atom
export const filteredEventsAtom = atom((get) => {
  const query = get(searchQueryAtom);
  const category = get(categoryFilterAtom);
  const events = get(eventsAtom);
  
  return events.filter((event) => {
    const matchesQuery = event.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !category || event.category === category;
    return matchesQuery && matchesCategory;
  });
});
```

### Usage

```typescript
import { useAtom } from 'jotai';
import { searchQueryAtom } from '@/atoms/filters';

function SearchBar() {
  const [query, setQuery] = useAtom(searchQueryAtom);
  
  return (
    <TextInput
      value={query}
      onChangeText={setQuery}
      placeholder="Search events..."
    />
  );
}
```

## Persistence

### Persisting Zustand

```typescript
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      // ... state
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: AsyncStorage.removeItem,
      },
    }
  )
);
```

## Best Practices

1. **Use React Query** for all server data
2. **Keep Zustand stores small** - One concern per store
3. **Use selectors** for derived state
4. **Don't duplicate state** - Derive when possible
5. **Type everything** - Use TypeScript interfaces

## File Organization

```
src/
├── stores/
│   ├── auth.ts
│   ├── theme.ts
│   └── index.ts
├── atoms/
│   ├── filters.ts
│   └── ui.ts
└── hooks/
    ├── useAuth.ts
    └── useTheme.ts
```

## Further Reading

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Jotai Documentation](https://jotai.org/)
- [React Query](https://tanstack.com/query/latest)
