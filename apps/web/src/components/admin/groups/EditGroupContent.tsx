'use client'

import { useCallback } from 'react'
import { EditGroupForm } from './EditGroupForm'

interface EditGroupContentProps {
  groupId?: string
}

/**
 * EditGroupContent - Container component for group editing
 *
 * Provides the full-page context for editing a group,
 * including navigation handling on success.
 *
 * @example
 * ```tsx
 * <EditGroupContent groupId="group-123" />
 * ```
 */
export function EditGroupContent({ groupId }: EditGroupContentProps) {
  const effectiveGroupId = groupId || ''

  const handleSuccess = useCallback(() => {
    window.location.href = '/groups'
  }, [])

  const handleCancel = useCallback(() => {
    window.location.href = '/groups'
  }, [])

  if (!effectiveGroupId) {
    return null
  }

  return (
    <EditGroupForm
      groupId={effectiveGroupId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}
