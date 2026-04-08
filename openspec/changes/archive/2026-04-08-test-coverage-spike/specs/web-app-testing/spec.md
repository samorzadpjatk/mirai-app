## ADDED Requirements

### Requirement: fileValidation utility functions shall be fully tested

The system SHALL provide comprehensive unit tests for all exported functions in `apps/web/src/lib/fileValidation.ts`, achieving 100% line and branch coverage.

#### Scenario: formatBytes handles edge cases

- **WHEN** testing formatBytes with zero, negative, or non-finite bytes
- **THEN** it SHALL return "0 B" for invalid inputs

#### Scenario: formatBytes converts bytes correctly

- **WHEN** testing formatBytes with 512 bytes
- **THEN** it SHALL return "512 B"
- **WHEN** testing with 1536 bytes (1.5 KB)
- **THEN** it SHALL return "1.5 KB"
- **WHEN** testing with 1572864 bytes (1.5 MB)
- **THEN** it SHALL return "1.5 MB"
- **WHEN** testing with 1610612736 bytes (1.5 GB)
- **THEN** it SHALL return "1.5 GB"

#### Scenario: validateFileType accepts allowed types

- **WHEN** validating a file with type "image/jpeg" against allowed types ["image/jpeg", "image/png"]
- **THEN** it SHALL return null (no error)

#### Scenario: validateFileType rejects disallowed types

- **WHEN** validating a file with type "application/pdf" against image mime types only
- **THEN** it SHALL return an error message indicating unsupported type

#### Scenario: validateFileType handles empty allowed list

- **WHEN** validating any file type with empty allowedMimeTypes array
- **THEN** it SHALL return null (no restriction)

#### Scenario: validateFileSize accepts files under limit

- **WHEN** validating a 5 MB file with maxSizeMb of 10
- **THEN** it SHALL return null (no error)

#### Scenario: validateFileSize rejects oversized files

- **WHEN** validating an 11 MB file with maxSizeMb of 10
- **THEN** it SHALL return an error message indicating file size exceeded

#### Scenario: validateImageFile validates both type and size

- **WHEN** validating a valid image file within size limits
- **THEN** it SHALL return null
- **WHEN** validating an oversized image
- **THEN** it SHALL return the size error
- **WHEN** validating a non-image file
- **THEN** it SHALL return the type error

#### Scenario: Default constants are exported correctly

- **WHEN** importing DEFAULT_MAX_FILE_SIZE_MB
- **THEN** it SHALL equal 10
- **WHEN** importing DEFAULT_IMAGE_MIME_TYPES
- **THEN** it SHALL contain "image/jpeg", "image/png", "image/webp", "image/gif"

### Requirement: useActiveTripId hook shall be tested with Happy DOM

The system SHALL provide unit tests for `apps/web/src/hooks/useActiveTripId.ts` that mock the browser environment (window, localStorage, URL) using Happy DOM.

#### Scenario: Hook extracts tripId from URL search params

- **GIVEN** window.location.search contains "?tripId=abc123"
- **WHEN** useActiveTripId is called
- **THEN** it SHALL return "abc123"

#### Scenario: Hook falls back to localStorage when no URL param

- **GIVEN** window.location.search is empty
- **AND** localStorage contains key "admin:selectedTripId" with value "stored456"
- **WHEN** useActiveTripId is called
- **THEN** it SHALL return "stored456"

#### Scenario: Hook returns empty string when neither source has value

- **GIVEN** window.location.search is empty
- **AND** localStorage has no value for "admin:selectedTripId"
- **WHEN** useActiveTripId is called
- **THEN** it SHALL return empty string

#### Scenario: Hook handles server-side rendering safely

- **GIVEN** typeof window is "undefined" (SSR context)
- **WHEN** useActiveTripId is called
- **THEN** it SHALL return empty string without throwing
