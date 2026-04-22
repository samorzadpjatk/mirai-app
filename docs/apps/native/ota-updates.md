# OTA Updates

## Overview

Expo Updates enables pushing JavaScript updates to users without requiring a full app store release.

## How It Works

```
Developer        EAS Update        User Device
    │                 │                 │
    │ Publish Update  │                 │
    │───────────────▶ │                 │
    │                 │                 │
    │                 │ Check for       │
    │                 │ Update          │
    │                 │◀────────────────│
    │                 │                 │
    │                 │ Serve Bundle      │
    │                 │────────────────▶│
    │                 │                 │
    │                 │                 │ Apply Update
```

## Publishing Updates

### CLI Commands

```bash
# Publish to production channel
eas update --branch production --message "Fix login bug"

# Publish to preview channel
eas update --branch preview --message "New feature preview"

# Auto branch from git
eas update --auto
```

### Update Groups

Multiple platforms in one update:

```bash
eas update --branch production --platform ios,android
```

## Channels and Branches

| Channel | Use Case |
|---------|----------|
| `production` | Live users |
| `preview` | Internal testing |
| `development` | Dev client |

### Mapping Builds to Channels

```json
// eas.json
{
  "build": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

## Runtime Versions

Updates only apply to compatible native builds.

### Version Policies

```json
// app.json
{
  "expo": {
    "runtimeVersion": {
      "policy": "sdkVersion"  // Use SDK version
    }
  }
}
```

Available policies:
- `sdkVersion` - Match Expo SDK version
- `appVersion` - Match app version
- `nativeVersion` - Match native code version
- `fingerprint` - Match native code fingerprint

## Implementation in Code

### Manual Check

```typescript
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  try {
    const update = await Updates.checkForUpdateAsync();
    
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}
```

### Automatic Check on Launch

```typescript
// app/_layout.tsx
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    if (!__DEV__) {
      Updates.checkForUpdateAsync().then((update) => {
        if (update.isAvailable) {
          Updates.fetchUpdateAsync().then(() => {
            Updates.reloadAsync();
          });
        }
      });
    }
  }, []);
  
  return <App />;
}
```

### With User Consent

```typescript
function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    Updates.checkForUpdateAsync().then((update) => {
      setUpdateAvailable(update.isAvailable);
    });
  }, []);
  
  const applyUpdate = async () => {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  };
  
  if (!updateAvailable) return null;
  
  return (
    <Banner
      message="An update is available"
      action={{ label: 'Update', onPress: applyUpdate }}
    />
  );
}
```

## Update Configuration

### app.json

```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    }
  }
}
```

### Check Frequency

- `ON_LOAD` - Check when app launches
- `ON_ERROR_RECOVERY` - Only check after error
- `WIFI_ONLY` - Only on WiFi
- `NEVER` - Manual checks only

## Monitoring Updates

### EAS Dashboard

View update status at https://expo.dev/accounts/[account]/projects/[project]/updates

### CLI

```bash
# List updates
eas update:list

# View update details
eas update:view [group-id]

# Rollback
eas update:republish --group [group-id]
```

## Best Practices

1. **Test updates** on a preview build before publishing to production
2. **Use descriptive messages** when publishing
3. **Monitor crash rates** after updates
4. **Have rollback plan** ready
5. **Don't publish breaking changes** via OTA

## Troubleshooting

### Update Not Applied

- Check runtime version compatibility
- Verify channel mapping
- Check network connectivity
- Review device logs

### Rollback

```bash
# Republish previous update
eas update:republish --group [previous-group-id]
```

## Limitations

- **Only JS updates** - Native code changes require new build
- **No background updates** - App must be restarted
- **Size limit** - ~30MB per update

## Further Reading

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
