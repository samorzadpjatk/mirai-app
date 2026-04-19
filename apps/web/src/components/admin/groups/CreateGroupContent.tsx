'use client'

import { useCallback } from 'react'
import { CreateGroupForm } from './CreateGroupForm'

/**
 * CreateGroupContent - Container component for group creation
 *
 * Provides the full-page context for creating a new group,
 * including navigation handling on success.
 *
 * @example
 * ```tsx
 * <CreateGroupContent />
 * ```
 */
export function CreateGroupContent() {
  const handleSuccess = useCallback(() => {
    window.location.href = '/groups'
  }, [])

  const handleCancel = useCallback(() => {
    window.location.href = '/groups'
  }, [])

  return (
    <CreateGroupForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}
