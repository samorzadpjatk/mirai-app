# PWA Implementation Guide

This document describes the Progressive Web App (PWA) features implemented in Bank Monet.

## Features Implemented

### 1. PWA Core Features
- ✅ Web App Manifest (`/public/manifest.json`)
- ✅ Service Worker with caching strategies
- ✅ App installation prompt
- ✅ Offline support with smart caching
- ✅ Mobile-responsive design

### 2. Push Notifications
- ✅ Web Push API integration
- ✅ VAPID keys configuration
- ✅ Subscription management
- ✅ Notification permissions handling
- ✅ Admin notification controls

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# VAPID Keys for Push Notifications
# Generate new keys using: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY="BLGVep9-6jFF-1Dlr0HEI5tFbJfH7t88ZUKTsoZf8UFr0nWDxAh5I7HbTBWOyZAcZRVU3ZgRR66ibGPgxtxASRA"
VAPID_PRIVATE_KEY="Vxcram9b0Lr5aNyxMJeWT_9fNvKsBzx5wx06wCaamxw"
VAPID_EMAIL="your-email@example.com"

# Client-side VAPID public key (must match VAPID_PUBLIC_KEY)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BLGVep9-6jFF-1Dlr0HEI5tFbJfH7t88ZUKTsoZf8UFr0nWDxAh5I7HbTBWOyZAcZRVU3ZgRR66ibGPgxtxASRA"
```

### 2. Database Migration

Run the Prisma migration to add the push subscription table:

```bash
npm run db:generate
```

### 3. PWA Icons (Optional)

The manifest references the following icon files in `/public/`:
- `icon-192x192.png`
- `icon-256x256.png`
- `icon-384x384.png`
- `icon-512x512.png`

You can generate these from your existing favicon or create custom ones.

## Testing the PWA

### 1. Development Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open Chrome DevTools:
   - Go to Application tab
   - Check "Service Workers" section
   - Verify "Manifest" is properly loaded

3. Test installation:
   - Look for install prompt in address bar
   - Or use DevTools > Application > Manifest > "Add to homescreen"

### 2. Push Notifications Testing

1. Go to Admin Dashboard → PWA & Powiadomienia tab
2. Click "Request Permission" to enable notifications
3. Click "Enable Notifications" to subscribe
4. Use "Test Local Notification" for browser notifications
5. Use "Test Push Notification" for server-sent notifications

### 3. Offline Testing

1. In Chrome DevTools, go to Network tab
2. Check "Offline" checkbox
3. Refresh the page - it should load from cache
4. Navigate between pages - they should work offline

## API Endpoints

### Push Notifications API (tRPC)

- `notifications.getVapidPublicKey` - Get VAPID public key
- `notifications.subscribe` - Subscribe to push notifications
- `notifications.unsubscribe` - Unsubscribe from notifications
- `notifications.sendToUser` - Send notification to specific user
- `notifications.sendToGroup` - Send notification to group members
- `notifications.getSubscriptionStatus` - Check subscription status

## PWA Components

### Components Added:
- `NotificationSettings` - Manage push notification preferences
- `PWAInstallPrompt` - Guide users through installation
- `useNotifications` - Hook for notification management

### Integration Points:
- Admin Dashboard - PWA management tab
- Service Worker - Custom push notification handling
- Layout - PWA metadata and viewport settings

## Caching Strategy

The service worker implements smart caching:

1. **Network First**: API calls, main pages
2. **Cache First**: Images, fonts, static assets
3. **Stale While Revalidate**: CSS, JS files

## Browser Support

- ✅ Chrome 42+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 17+
- ⚠️ iOS Safari (install via Add to Home Screen)

## Security Notes

- VAPID keys should be kept secure
- Push notifications require HTTPS (except localhost)
- Service workers only work over HTTPS in production

## Troubleshooting

### Common Issues:

1. **Service Worker not registering**
   - Check console for errors
   - Ensure HTTPS in production
   - Clear browser cache

2. **Push notifications not working**
   - Verify VAPID keys are set correctly
   - Check notification permissions
   - Ensure subscription is saved to database

3. **Install prompt not showing**
   - Must meet PWA criteria
   - User hasn't installed before
   - Use manual instructions for iOS

### Debug Tools:

- Chrome DevTools > Application tab
- PWA installability check: `lighthouse --only-categories=pwa`
- Service worker debugging in Application > Service Workers
