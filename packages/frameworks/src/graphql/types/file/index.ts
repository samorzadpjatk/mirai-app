// File domain module - exports and side-effect registration
// Importing this module registers all File types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";

// Re-export all types
export {
  FileDownloadPayloadType,
  CreateDownloadUrlInput,
  FileUploadPayloadType,
  CreateUploadUrlInput,
} from "./types.js";
