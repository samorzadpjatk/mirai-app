/**
 * Adapter Errors - Barrel Export
 *
 * @module errors
 */

export {
  // Database errors
  DatabaseError,
  DatabaseConnectionError,
  DatabaseTransactionError,
  // External API errors
  ExternalAPIError,
  ExternalAPITimeoutError,
  // Storage errors
  StorageError,
  StorageFileNotFoundError,
  // Mapping errors
  MappingError,
  // Configuration errors
  ConfigurationError,
  // Union type
  type AdapterError,
  // Utility functions
  isAdapterError,
  getAdapterErrorMessage,
  getAdapterErrorCode,
} from "./AdapterErrors";
