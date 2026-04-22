# Navigation Structure

## Overview

The native app uses **Expo Router** for file-based navigation, built on React Navigation.

## Navigation Types

### Stack Navigation

Default navigation pattern. Screens stack on top of each other.

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

### Tab Navigation

Bottom tab bar for main app sections.

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

### Modal Presentation

Present screens as modals.

```typescript
// app/_layout.tsx
<Stack.Screen 
  name="settings" 
  options={{ presentation: 'modal' }} 
/>
```

## Route Structure

```
app/
├── _layout.tsx              # Root layout
├── index.tsx                # Home screen (accessible at /)
├── (tabs)/                  # Tab group (no URL segment)
│   ├── _layout.tsx          # Tab layout
│   ├── index.tsx            # Home tab
│   └── profile.tsx          # Profile tab
├── auth/                    # Auth group
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   └── sign-up.tsx
├── event/
│   └── [id].tsx             # Dynamic route: /event/123
└── (modals)/                # Modal group
    └── settings.tsx         # Settings modal
```

## Navigation API

### Linking

```typescript
import { Link } from 'expo-router';

// Using Link component
<Link href="/profile">Go to Profile</Link>

// With params
<Link href="/event/123">View Event</Link>

// Modal
<Link href="/settings" asChild>
  <Button title="Settings" />
</Link>
```

### Programmatic Navigation

```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();
  
  // Navigate
  router.push('/profile');
  
  // Navigate with params
  router.push(`/event/${eventId}`);
  
  // Replace (don't add to history)
  router.replace('/home');
  
  // Go back
  router.back();
  
  // Navigate to modal
  router.push('/settings');
}
```

### Route Parameters

```typescript
// app/event/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function EventScreen() {
  const { id } = useLocalSearchParams();
  
  return <Text>Event ID: {id}</Text>;
}
```

Access via URL: `/event/123`

## Deep Linking

### Configuration

```typescript
// app.json
{
  "expo": {
    "scheme": "mirai",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "mirai" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Usage

```
mirai://event/123
mirai://auth/sign-in
```

## Protected Routes

```typescript
// app/_layout.tsx
import { useAuth } from '@mirai-app/auth';
import { Redirect, Stack } from 'expo-router';

export default function RootLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  
  if (!user) {
    return <Redirect href="/auth/sign-in" />;
  }
  
  return <Stack />;
}
```

## Navigation State

### Getting Current Route

```typescript
import { usePathname } from 'expo-router';

const pathname = usePathname(); // "/event/123"
```

### Navigation Events

```typescript
import { useNavigation } from 'expo-router';

const navigation = useNavigation();

useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Screen focused
  });
  
  return unsubscribe;
}, [navigation]);
```

## Best Practices

1. **Use groups** (parentheses) for layout organization without URL segments
2. **Keep layouts simple** - Don't nest too deeply
3. **Use dynamic routes** for entity pages
4. **Handle auth redirects** in root layout
5. **Use `asChild`** on Links when wrapping custom components

## Further Reading

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Navigation](https://reactnavigation.org/)
