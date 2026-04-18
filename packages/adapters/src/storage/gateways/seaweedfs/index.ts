// SeaweedFS Storage Gateway exports (simplified - no tusd/ticket dependencies)

// Storage errors
export {
  StorageError,
  FileNotFoundError,
} from "../../errors/StorageErrors";

export {
  // Configuration types
  type SeaweedFSConfig,

  // Default configuration values
  defaultSeaweedFSConfig,

  // Validation functions
  validateSeaweedFSConfig,
  loadConfigFromEnv,

  // Error types
  ConfigurationError,
} from "./SeaweedFSConfig";

// SeaweedFSStorageGateway
export { SeaweedFSStorageGateway } from "./SeaweedFSStorageGateway";
