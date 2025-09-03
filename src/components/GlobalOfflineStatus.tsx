/**
 * Global Offline Status Indicator
 * Shows pending offline requests and allows manual retry
 */

'use client';

import { useOfflineStatus } from '../hooks/useUniversalOfflineMutation';
import { useState } from 'react';
import { Button, Card, Text, Flex } from '@radix-ui/themes';

export default function GlobalOfflineStatus() {
  const { isOnline, offlineRequestsCount } = useOfflineStatus();
  const [isVisible, setIsVisible] = useState(true);

  // Only show when there are offline requests or when offline
  const shouldShow = (!isOnline || offlineRequestsCount > 0) && isVisible;

  if (!shouldShow) return null;

  const handleRetryNow = async () => {
    try {
      const { triggerManualSync } = await import('../utils/backgroundSync');
      await triggerManualSync();
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Auto-show again if more requests appear
    setTimeout(() => setIsVisible(true), 10000);
  };

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: isOnline ? 'var(--orange-2)' : 'var(--red-2)',
        border: isOnline ? '1px solid var(--orange-6)' : '1px solid var(--red-6)',
        zIndex: 9999,
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="2" weight="bold" color={isOnline ? 'orange' : 'red'}>
            {!isOnline && 'Offline Mode'}
            {isOnline && offlineRequestsCount > 0 && `${offlineRequestsCount} Pending Operations`}
          </Text>
          <Button 
            size="1" 
            variant="ghost" 
            onClick={handleDismiss}
            style={{ padding: '2px 6px' }}
          >
            ×
          </Button>
        </Flex>

        <Text size="1" color="gray">
          {!isOnline && 'Operations will be saved and retried when connection is restored.'}
          {isOnline && offlineRequestsCount > 0 && 'These operations will be automatically retried.'}
        </Text>

        {isOnline && offlineRequestsCount > 0 && (
          <Flex gap="2" justify="end">
            <Button size="1" variant="soft" onClick={handleRetryNow}>
              Retry Now
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
