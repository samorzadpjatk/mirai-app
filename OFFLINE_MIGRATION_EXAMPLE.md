# Offline Migration Example

## Before and After: Converting a Component to Offline-Ready

### BEFORE: Regular tRPC Mutation (bez offline)

```typescript
"use client"

import { useState } from "react";
import { Button, TextField, Text } from "@radix-ui/themes";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

const CreateGroupForm = () => {
    const router = useRouter();
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    // Regular mutation - NO offline handling
    const createGroupMutation = api.group.create.useMutation({
        onSuccess: () => {
            setName("");
            setError("");
            router.refresh();
        },
        onError: (error) => {
            setError(error.message); // Shows raw network error!
        }
    });

    const handleSubmit = () => {
        if (!name.trim()) return;
        
        createGroupMutation.mutate({
            name: name.trim(),
            code: generateCode(name)
        });
    };

    return (
        <div>
            <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
            />
            
            {error && (
                <Text color="red">{error}</Text> // Shows "NetworkError when attempting to fetch resource."
            )}
            
            <Button 
                onClick={handleSubmit}
                disabled={createGroupMutation.isPending}
            >
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
        </div>
    );
};
```

**Problems with the above:**
❌ Network errors show cryptic messages  
❌ Operations fail completely when offline  
❌ User loses their work if network fails  
❌ No automatic retry when connection restored  

---

### AFTER: Offline-Ready Component (z universal offline)

```typescript
"use client"

import { useState } from "react";
import { Button, TextField, Text } from "@radix-ui/themes";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useOfflineGroupMutation } from "~/hooks/useUniversalOfflineMutation"; // ← ADD THIS LINE

const CreateGroupForm = () => {
    const router = useRouter();
    const [name, setName] = useState("");

    // Enhanced mutation with offline handling
    const offlineGroupCreate = useOfflineGroupMutation('create');
    const { mutation: createGroupMutation, offlineStatus } = offlineGroupCreate(() => 
        api.group.create.useMutation({
            onSuccess: () => {
                setName("");
                router.refresh();
            }
        })
    );

    const handleSubmit = () => {
        if (!name.trim()) return;
        
        createGroupMutation.mutate({
            name: name.trim(),
            code: generateCode(name)
        });
    };

    return (
        <div>
            <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
            />
            
            {/* Universal offline status - handles all error types */}
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
                            Group will be created when connection is restored.
                        </Text>
                    )}
                </div>
            )}
            
            <Button 
                onClick={handleSubmit}
                disabled={createGroupMutation.isPending}
            >
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
        </div>
    );
};
```

**Benefits of the migration:**
✅ User-friendly offline messages  
✅ Operations saved for later retry  
✅ Automatic sync when connection restored  
✅ Works in all browsers with fallbacks  
✅ Visual feedback for offline operations  
✅ Browser notifications for offline saves  

---

## Simple 3-Step Migration Process

### Step 1: Import the Hook
```typescript
import { useOfflineGroupMutation } from "~/hooks/useUniversalOfflineMutation";
```

### Step 2: Wrap Your Mutation
```typescript
// Before
const mutation = api.group.create.useMutation({ onSuccess: ... });

// After  
const offlineCreate = useOfflineGroupMutation('create');
const { mutation, offlineStatus } = offlineCreate(() => 
    api.group.create.useMutation({ onSuccess: ... })
);
```

### Step 3: Add Status Display
```typescript
{offlineStatus && (
    <div>Status: {offlineStatus}</div>
)}
```

---

## Available Specialized Hooks

### Coin Operations
```typescript
import { useOfflineCoinMutation } from "~/hooks/useUniversalOfflineMutation";

const offlineAddCoins = useOfflineCoinMutation('add');
const offlineRemoveCoins = useOfflineCoinMutation('remove');
```

### Group Operations  
```typescript
import { useOfflineGroupMutation } from "~/hooks/useUniversalOfflineMutation";

const offlineCreate = useOfflineGroupMutation('create');
const offlineUpdate = useOfflineGroupMutation('update');
const offlineDelete = useOfflineGroupMutation('delete');
```

### User Operations
```typescript
import { useOfflineUserMutation } from "~/hooks/useUniversalOfflineMutation";

const offlineWristUpdate = useOfflineUserMutation('updateWristNumber');
const offlineAdminStatus = useOfflineUserMutation('updateUserAdminStatus');
```

### Universal Hook (for any operation)
```typescript
import { useUniversalOfflineMutation } from "~/hooks/useUniversalOfflineMutation";

const { mutation, offlineStatus } = useUniversalOfflineMutation({
    mutationHook: () => api.anyModule.anyOperation.useMutation({ ... }),
    procedureName: 'anyModule.anyOperation',
    successMessage: "Operation completed",
    errorMessage: "Operation failed"
});
```

---

## Real Migration Examples in Codebase

### ✅ CoinOperationFormCard.tsx
**Lines changed:** 4 lines  
**Migration time:** 2 minutes  
**Result:** Coin operations now work offline with auto-retry

### ✅ CreateGroupDialog.tsx  
**Lines changed:** 3 lines  
**Migration time:** 1 minute  
**Result:** Group creation works offline with user feedback

### ✅ WristNumberManager.tsx
**Lines changed:** 6 lines  
**Migration time:** 3 minutes  
**Result:** Wrist number updates saved offline with retry

---

## Testing Your Migration

1. **Open DevTools** → Network tab → Check "Offline"
2. **Perform operation** → Should show orange "saved for later" message
3. **Go back online** → Should auto-retry and succeed
4. **Check localStorage** → Should see stored requests during offline

---

## Quick Reference: What Changes?

| Component Part | Before | After |
|-------|--------|-------|
| **Import** | `import { api } from "~/trpc/react"` | `import { api } from "~/trpc/react"`<br/>`import { useOfflineGroupMutation } from "~/hooks/useUniversalOfflineMutation"` |
| **Hook Usage** | `api.group.create.useMutation({ ... })` | `useOfflineGroupMutation('create')(() => api.group.create.useMutation({ ... }))` |
| **Error Handling** | Manual `onError` callbacks | Automatic with `offlineStatus` |
| **UI Feedback** | Custom error display | Standard offline status component |

**That's it!** 🚀 Your component is now offline-ready with automatic retry!
