/**
 * Storage Gateways Index
 *
 * Re-exports all file storage adapter implementations.
 * Part of Phase 0: Supabase-Agnostic Architecture
 */

export { SupabaseStorageAdapter } from "./SupabaseStorageAdapter";
export { InMemoryStorageAdapter } from "./InMemoryStorageAdapter";
export { S3StorageAdapter } from "./S3StorageAdapter";
