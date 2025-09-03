# Universal Offline System - Development Guide

## Overview

This application now features a **Universal Offline System** that automatically handles network errors for all tRPC mutations. When the app is offline, failed requests are stored locally and automatically retried when connectivity is restored.

## Key Features

### ✅ What Works Offline:
- **Coin Operations**: Adding/removing coins
- **Group Management**: Creating, updating, deleting groups  
- **User Management**: Assigning users to groups, wrist number updates
- **Notifications**: Sending user/group notifications
- **All tRPC Mutations**: Any operation can be made offline-ready

### 🔄 Auto-Retry System:
- **Background Sync**: Native browser API (Chrome/Edge support)
- **Manual Fallback**: For Firefox/Safari with limited support
- **Visual Feedback**: Real-time status indicators
- **Browser Notifications**: User alerts for offline operations

## How to Make Any Component Offline-Ready

### 1. Import the Universal Hook

```typescript
import { useUniversalOfflineMutation } from "~/hooks/useUniversalOfflineMutation";
```

### 2. Basic Implementation

```typescript
// Before (regular tRPC mutation)
const createMutation = api.group.create.useMutation({
  onSuccess: () => {
    router.refresh();
  }
});

// After (offline-ready mutation)
const { mutation: createMutation, offlineStatus } = useUniversalOfflineMutation({
  mutationHook: () => api.group.create.useMutation({
    onSuccess: () => router.refresh()
  }),
  procedureName: 'group.create',
  successMessage: "Group created successfully",
  errorMessage: "Failed to create group"
});
```

### 3. Specialized Hooks (Recommended)

For common operations, use the specialized hooks:

```typescript
// Coin operations
const offlineCoinAdd = useOfflineCoinMutation('add');
const { mutation, offlineStatus } = offlineCoinAdd(() => 
  api.coin.addCoins.useMutation({ onSuccess: () => router.refresh() })
);

// Group operations  
const offlineGroupCreate = useOfflineGroupMutation('create');
const { mutation, offlineStatus } = offlineGroupCreate(() => 
  api.group.create.useMutation({ onSuccess: () => router.refresh() })
);

// User operations
const offlineUserUpdate = useOfflineUserMutation('updateWristNumber');
const { mutation, offlineStatus } = offlineUserUpdate(() => 
  api.user.updateWristNumber.useMutation({ onSuccess: () => router.refresh() })
);
```

### 4. Add Visual Feedback

```typescript
// Show offline status to user
{offlineStatus && (
  <div style={{ 
    padding: '0.75rem', 
    borderRadius: '0.5rem',
    backgroundColor: offlineStatus.includes('saved for later') ? 'var(--orange-2)' : 'var(--red-2)',
    border: offlineStatus.includes('saved for later') ? '1px solid var(--orange-6)' : '1px solid var(--red-6)'
  }}>
    <Text color={offlineStatus.includes('saved for later') ? 'orange' : 'red'}>
      {offlineStatus.includes('saved for later') ? '📡' : '❌'} {offlineStatus}
    </Text>
    {offlineStatus.includes('saved for later') && (
      <Text size="1" color="gray" style={{ display: 'block', marginTop: '0.5rem' }}>
        Operation will be completed when connection is restored.
      </Text>
    )}
  </div>
)}
```

## Architecture Overview

### Core Components

1. **`useUniversalOfflineMutation`** - Main hook for any tRPC mutation
2. **`offlineErrorHandler.ts`** - Core offline logic and storage
3. **`ServiceWorkerMessageHandler`** - Cross-thread localStorage communication
4. **`GlobalOfflineStatus`** - Global offline status indicator
5. **Enhanced Service Worker** - Background sync and retry logic

### Data Flow

```
1. User Action → 2. tRPC Mutation → 3. Network Error? → 4. Store in localStorage
                                                     ↓
8. Success! ← 7. Execute Request ← 6. Background Sync ← 5. Store Request
```

### Storage Format

Offline requests are stored in `localStorage` with this structure:

```typescript
interface OfflineRequest {
  id: string;
  type: string;        // e.g., 'coin.addCoins', 'group.create'  
  input: any;          // Original mutation input
  timestamp: number;   // When it was stored
  error: any;          // Original error for debugging
}
```

## Browser Compatibility

| Browser | Background Sync | Offline Handling | Auto-Retry |
|---------|----------------|------------------|------------|
| Chrome/Edge | ✅ Native | ✅ Full | ✅ Automatic |
| Firefox | ⚠️ Fallback | ✅ Full | ✅ Manual/Event |
| Safari | ⚠️ Fallback | ✅ Full | ✅ Manual/Event |

## Testing Offline Functionality

### In Chrome/Edge:
1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Perform operations → should save for later
4. Uncheck "Offline" → should auto-retry

### In Firefox:
1. Open Developer Tools → Network tab  
2. Click settings gear → "Work Offline"
3. Perform operations → should save for later
4. Disable offline mode → should auto-retry

### In Safari:
1. Open Web Inspector → Network tab
2. Click settings icon → "Offline"
3. Or disable Wi-Fi system-wide
4. Perform operations → should save for later
5. Restore connection → should auto-retry

## Adding New Operation Types

### 1. Add to Service Worker

Edit `src/app/sw.ts` and add your new operation to the switch statement:

```typescript
case 'myModule.myOperation':
  endpoint = '/api/trpc/myModule.myOperation';
  break;
```

### 2. Update Operation Descriptions

Edit `useUniversalOfflineMutation.ts` and add user-friendly descriptions:

```typescript
case 'myModule.myOperation':
  return `performing custom operation`;
```

### 3. Create Specialized Hook (Optional)

```typescript
export function useOfflineMyModuleMutation(operation: string) {
  return (mutationHook: () => any) => useUniversalOfflineMutation({
    mutationHook,
    procedureName: `myModule.${operation}`,
    successMessage: "Operation completed successfully",
    errorMessage: "Operation failed"
  });
}
```

## Global Status Monitoring

The `GlobalOfflineStatus` component automatically:
- Shows when the app is offline
- Displays count of pending operations  
- Provides manual retry button
- Auto-hides when everything is synced

## Performance Considerations

- **Storage Limit**: localStorage has ~5-10MB limit per domain
- **Auto-Cleanup**: Failed requests are removed after successful retry
- **Batch Processing**: Multiple requests are processed efficiently
- **Memory Usage**: Minimal impact on app performance

## Example Implementations

See these components for reference:
- `CoinOperationFormCard.tsx` - Coin operations
- `CreateGroupDialog.tsx` - Group creation
- `WristNumberManager.tsx` - User updates
- `AssignUserToGroupFormDialog.tsx` - User assignments

## Troubleshooting

### Common Issues:

1. **localStorage Full**: Clear offline requests manually or increase storage
2. **Service Worker Not Registered**: Check browser console for registration errors  
3. **Auto-Retry Not Working**: Verify network event listeners are active
4. **Cross-Tab Sync Issues**: Ensure ServiceWorkerMessageHandler is in layout

### Debug Mode:

Enable verbose logging:
```javascript
localStorage.setItem('offline-debug', 'true');
```

### Manual Operations:

```javascript
// Check pending requests
console.log(localStorage.getItem('offlineRequests'));

// Trigger manual sync
import { triggerManualSync } from '~/utils/backgroundSync';
triggerManualSync();

// Clear all offline requests (emergency)
localStorage.removeItem('offlineRequests');
```

## Best Practices

1. **Always add visual feedback** for offline operations
2. **Use specialized hooks** when available (cleaner code)
3. **Test in all browsers** especially Firefox and Safari
4. **Provide clear user messages** about what will happen offline
5. **Consider data dependencies** when operations are retried later
6. **Add proper error handling** for edge cases

## Future Enhancements

- **Conflict Resolution**: Handle data conflicts when retrying old operations
- **Priority Queuing**: Retry important operations first
- **Data Validation**: Validate stored requests before retry
- **Analytics**: Track offline usage patterns
- **Compression**: Compress stored requests to save space
