/**
 * Storage Gateways Index
 *
 * Re-exports all file storage adapter implementations.
 * Part of Phase 0: Supabase-Agnostic Architecture
 */

export { SupabaseStorageAdapter } from "./supabase/adapter";
export { InMemoryStorageAdapter } from "./in-memory/adapter";
export { S3StorageAdapter } from "./s3/adapter";
