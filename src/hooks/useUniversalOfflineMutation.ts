/**
 * Universal Offline Mutation Hook
 * Automatycznie dodaje offline handling do wszystkich tRPC mutations
 */

'use client';

import { useState, useEffect } from 'react';
import { handleOfflineMutation, isNetworkError, getOfflineRequestsCount } from '../utils/offlineErrorHandler';

interface OfflineMutationOptions<TInput, TOutput> {
  mutationHook: () => any; // Original tRPC mutation hook
  procedureName: string;    // e.g. "group.create", "coin.addCoins"
  onSuccess?: (data: TOutput, variables: TInput) => void;
  onError?: (error: any, variables: TInput) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook that wraps any tRPC mutation with offline capabilities
 */
export function useUniversalOfflineMutation<TInput, TOutput>({
  mutationHook,
  procedureName,
  onSuccess,
  onError,
  successMessage = "Operation completed successfully",
  errorMessage = "Operation failed"
}: OfflineMutationOptions<TInput, TOutput>) {
  
  const [offlineStatus, setOfflineStatus] = useState<string>("");
  const originalMutation = mutationHook();

  // Auto-dismiss offline status after a short delay
  useEffect(() => {
    if (!offlineStatus) return;

    const isSavedForLater = offlineStatus.includes("saved for later retry");
    const timeoutMs = isSavedForLater ? 5000 : 6000; // dismiss sooner for saved-for-later

    const timer = setTimeout(() => {
      setOfflineStatus("");
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [offlineStatus]);

  // Create enhanced mutation with offline handling
  const enhancedMutation = {
    ...originalMutation,
    mutate: (variables: TInput) => {
      setOfflineStatus(""); // Clear previous status
      originalMutation.mutate(variables, {
        onSuccess: (data: TOutput) => {
          setOfflineStatus("");
          onSuccess?.(data, variables);
        },
        onError: (error: any) => {
          console.log(`Mutation ${procedureName} failed:`, error);
          
          if (isNetworkError(error)) {
            console.log(`Network error detected for ${procedureName}, storing offline...`);
            
            // Store request for offline retry
            handleOfflineMutation(procedureName, variables, error);
            
            // Set user-friendly offline status
            setOfflineStatus(`Network error - ${getOperationDescription(procedureName, variables)} saved for later retry`);
            
            // Show browser notification
            showOfflineNotification(procedureName, variables);
          } else {
            // Handle non-network errors normally
            setOfflineStatus(`${errorMessage}: ${error.message}`);
            onError?.(error, variables);
          }
        }
      });
    },
    mutateAsync: async (variables: TInput) => {
      setOfflineStatus("");
      try {
        const result = await originalMutation.mutateAsync(variables);
        setOfflineStatus("");
        onSuccess?.(result, variables);
        return result;
      } catch (error: any) {
        console.log(`Async mutation ${procedureName} failed:`, error);
        
        if (isNetworkError(error)) {
          console.log(`Network error detected for ${procedureName}, storing offline...`);
          
          handleOfflineMutation(procedureName, variables, error);
          setOfflineStatus(`Network error - ${getOperationDescription(procedureName, variables)} saved for later retry`);
          showOfflineNotification(procedureName, variables);
          
          // Don't throw for network errors - they're handled offline
          return null;
        } else {
          setOfflineStatus(`${errorMessage}: ${error.message}`);
          onError?.(error, variables);
          throw error;
        }
      }
    }
  };

  return {
    mutation: enhancedMutation,
    offlineStatus,
    clearOfflineStatus: () => setOfflineStatus(""),
    isOfflineError: offlineStatus.includes('saved for later retry')
  };
}

/**
 * Generate user-friendly description of the operation
 */
function getOperationDescription(procedureName: string, variables: any): string {
  switch (procedureName) {
    case 'coin.addCoins':
      return `adding ${variables.amount} coins`;
    case 'coin.removeCoins':
      return `removing ${variables.amount} coins`;
    case 'group.create':
      return `creating group "${variables.name}"`;
    case 'group.update':
      return `updating group`;
    case 'group.delete':
      return `deleting group`;
    case 'group.join':
      return `joining group`;
    case 'group.assignUserToGroup':
      return `assigning user to group`;
    case 'group.removeUserFromGroup':
      return `removing user from group`;
    case 'user.updateUserAdminStatus':
      return `updating admin status`;
    case 'user.updateWristNumber':
      return `updating wrist number`;
    case 'user.removeWristNumber':
      return `removing wrist number`;
    case 'notifications.sendToUser':
      return `sending notification`;
    case 'notifications.sendToGroup':
      return `sending group notification`;
    case 'notifications.subscribe':
      return `subscribing to notifications`;
    case 'notifications.unsubscribe':
      return `unsubscribing from notifications`;
    case 'notificationSchedule.create':
      return `creating notification schedule`;
    case 'notificationSchedule.update':
      return `updating notification schedule`;
    case 'notificationSchedule.delete':
      return `deleting notification schedule`;
    case 'notificationSchedule.toggleActive':
      return `toggling schedule status`;
    case 'notificationSchedule.updateLastRun':
      return `updating schedule timestamp`;
    default:
      return `${procedureName.replace('.', ' ')} operation`;
  }
}

/**
 * Show browser notification for offline operation
 */
function showOfflineNotification(procedureName: string, variables: any) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Operation Saved Offline', {
      body: `${getOperationDescription(procedureName, variables)} will be completed when connection is restored.`,
      icon: '/GRAL192.png'
    });
  }
}

/**
 * Hook to monitor global offline status
 */
export function useOfflineStatus() {
  const [offlineRequestsCount, setOfflineRequestsCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateCounts = () => {
      setOfflineRequestsCount(getOfflineRequestsCount());
    };

    const handleOnline = () => {
      setIsOnline(true);
      // Trigger auto-retry after short delay
      setTimeout(async () => {
        try {
          const { triggerManualSync } = await import('../utils/backgroundSync');
          triggerManualSync();
        } catch (error) {
          console.error('Failed to trigger sync on online event:', error);
        }
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Update counts every 5 seconds
    updateCounts();
    const interval = setInterval(updateCounts, 5000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    offlineRequestsCount,
    hasOfflineRequests: offlineRequestsCount > 0
  };
}

/**
 * Specific hooks for common operations
 */

// Coin operations
export function useOfflineCoinMutation(operation: 'add' | 'remove') {
  const procedureName = operation === 'add' ? 'coin.addCoins' : 'coin.removeCoins';
  
  return (mutationHook: () => any) => useUniversalOfflineMutation({
    mutationHook,
    procedureName,
    successMessage: `Coins ${operation === 'add' ? 'added' : 'removed'} successfully`,
    errorMessage: `Failed to ${operation} coins`
  });
}

// Group operations  
export function useOfflineGroupMutation(operation: 'create' | 'update' | 'delete') {
  return (mutationHook: () => any) => useUniversalOfflineMutation({
    mutationHook,
    procedureName: `group.${operation}`,
    successMessage: `Group ${operation === 'create' ? 'created' : operation === 'update' ? 'updated' : 'deleted'} successfully`,
    errorMessage: `Failed to ${operation} group`
  });
}

// User operations
export function useOfflineUserMutation(operation: string) {
  return (mutationHook: () => any) => useUniversalOfflineMutation({
    mutationHook,
    procedureName: `user.${operation}`,
    successMessage: "User operation completed successfully",
    errorMessage: "User operation failed"
  });
}

// Notification operations
export function useOfflineNotificationMutation() {
  return (mutationHook: () => any, operation: string) => useUniversalOfflineMutation({
    mutationHook,
    procedureName: `notifications.${operation}`,
    successMessage: "Notification sent successfully",
    errorMessage: "Failed to send notification"
  });
}

// Notification Schedule operations
export function useOfflineNotificationScheduleMutation(operation: string) {
  return (mutationHook: () => any) => useUniversalOfflineMutation({
    mutationHook,
    procedureName: `notificationSchedule.${operation}`,
    successMessage: `Schedule ${operation === 'create' ? 'created' : operation === 'update' ? 'updated' : operation === 'delete' ? 'deleted' : 'modified'} successfully`,
    errorMessage: `Failed to ${operation} schedule`
  });
}

// Push Subscription operations
export function useOfflinePushSubscriptionMutation(operation: 'subscribe' | 'unsubscribe') {
  return (mutationHook: () => any) => useUniversalOfflineMutation({
    mutationHook,
    procedureName: `notifications.${operation}`,
    successMessage: `Successfully ${operation === 'subscribe' ? 'subscribed to' : 'unsubscribed from'} notifications`,
    errorMessage: `Failed to ${operation} notifications`
  });
}
