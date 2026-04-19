/**
 * Hooks Index
 *
 * Central export point for all custom React hooks in the web app.
 *
 * ## Usage
 *
 * ```tsx
 * // Import specific hooks
 * import { useAdminList } from '@/hooks';
 * import { useTripContext } from '@/hooks';
 *
 * // Or import together
 * import { useAdminList, useTripContext } from '@/hooks';
 * ```
 *
 * @module @mirai-app/web/hooks
 */

// Admin list hook for CRUD pages
export { useAdminList, default as useAdminListDefault } from './useAdminList';
export type { UseAdminListOptions, UseAdminListResult } from './useAdminList';

// Trip context hook for multi-tenant data
export { useTripContext, useTripChangeListener, useBaseTripContext } from './useTripContext';
export type { Trip, TripContextValue } from './useTripContext';

// File upload hook with SeaweedFS Filer native TUS support
export { useFileUpload, Upload as TusUpload } from './useFileUpload';
export type {
  UseFileUploadResult,
  UseFileUploadOptions,
  UploadStatus,
  FileUploadError,
  FileValidationError,
  UploadUrlError,
  NetworkError,
} from './useFileUpload';

// =============================================================================
// Admin Hooks (P4: Validation & Admin Hooks)
// =============================================================================

// Challenge form hook with complex validation
export { useChallengeForm } from './admin/useChallengeForm';
export type {
  UseChallengeFormResult,
  ChallengeBasicInfoSectionProps,
  ChallengeTypeSectionProps,
  PeerVotingSectionProps,
  RecurringSectionProps,
  LocationSectionProps,
  PointsSectionProps,
} from './admin/useChallengeForm';

// Judging hook with Effect DI integration
export {
  useJudgement,
  useBatchJudgement,
} from './admin/useJudgement';
export type {
  UseJudgementOptions,
  UseJudgementResult,
  JudgementSuccessResult,
  BatchJudgementInput,
  BatchJudgementResult,
  UseBatchJudgementOptions,
  UseBatchJudgementResult,
} from './admin/useJudgement';
