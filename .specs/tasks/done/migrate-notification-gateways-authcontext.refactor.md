---
title: Migrate notificationDelivery and notificationSender gateways with AuthContext
---

## Initial User Prompt

Implement: Migrate notificationDelivery and notificationSender gateways with AuthContext

Task: Add auth protection to notificationDelivery and notificationSender

Your task:
1. Check if NotificationDelivery gateway exists in `packages/adapters/src/notification/`
2. If exists, migrate it:
   - Add AuthContext pattern
   - Delivery tracking is mostly system/internal but some endpoints may need auth
   - Check which methods need protection (likely admin-only for delivery stats)

3. Check if NotificationSender gateway exists
4. If exists, migrate it:
   - Some endpoints are webhooks (public)
   - Some may need admin auth for sending notifications
   - Add auth where needed

5. These are lower priority than the HIGH items

When complete, report:
1. NotificationDelivery gateway status
2. NotificationSender gateway status
3. Auth protection added where needed

## Description

// Will be filled in future stages by business analyst
