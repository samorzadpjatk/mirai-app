# Purpose

This specification defines the documentation requirements for the Expo React Native app (apps/native), covering project structure, EAS configuration, navigation, native modules, OTA updates, platform considerations, and state management.

## Requirements

### Requirement: Expo project structure documentation
The apps/native AGENTS.md and docs/apps/native/ files SHALL document the Expo project structure, including app.json configuration and entry points.

#### Scenario: Understanding Expo project
- **WHEN** an AI assistant needs to understand the Expo project structure
- **THEN** they SHALL find documentation on app.json configuration
- **AND** they SHALL find the main entry points
- **AND** they SHALL understand the folder organization

### Requirement: EAS configuration documentation
The apps/native AGENTS.md and docs/apps/native/ files SHALL document EAS (Expo Application Services) configuration, including eas.json profiles and build configuration.

#### Scenario: Working with EAS builds
- **WHEN** an AI assistant needs to work with EAS builds
- **THEN** they SHALL find documentation on eas.json profiles
- **THEN** they SHALL understand development, preview, and production profiles
- **AND** they SHALL find build command examples

### Requirement: Navigation structure documentation
The docs/apps/native/ files SHALL document the navigation structure and routing patterns used in the native application.

#### Scenario: Understanding navigation
- **WHEN** an AI assistant needs to understand or modify navigation
- **THEN** they SHALL find documentation on the navigation library used
- **AND** they SHALL understand the screen hierarchy
- **AND** they SHALL find examples of navigation patterns

### Requirement: Native module handling documentation
The docs/apps/native/ files SHALL document how native modules are handled, including installation, linking, and usage patterns.

#### Scenario: Working with native modules
- **WHEN** an AI assistant needs to add or use native modules
- **THEN** they SHALL find documentation on native module installation
- **AND** they SHALL understand linking (automatic vs manual)
- **AND** they SHALL find usage patterns for common native modules

### Requirement: OTA updates documentation
The docs/apps/native/ files SHALL document the OTA (Over-The-Air) updates workflow, including EAS Update configuration and usage.

#### Scenario: Understanding OTA updates
- **WHEN** an AI assistant needs to understand OTA updates
- **THEN** they SHALL find documentation on EAS Update configuration
- **AND** they SHALL understand the update publishing workflow
- **AND** they SHALL find testing and debugging guidance

### Requirement: Platform-specific considerations documentation
The docs/apps/native/ files SHALL document platform-specific considerations for iOS and Android, including platform-specific configuration and code.

#### Scenario: Handling platform differences
- **WHEN** an AI assistant needs to handle iOS/Android differences
- **THEN** they SHALL find documentation on platform-specific configuration
- **AND** they SHALL find examples of platform-specific code
- **AND** they SHALL understand testing on both platforms

### Requirement: State management documentation
The docs/apps/native/ files SHALL document state management patterns used in the native application, including any stores or context providers.

#### Scenario: Understanding state management
- **WHEN** an AI assistant needs to understand or modify state management
- **THEN** they SHALL find documentation on state management approach
- **AND** they SHALL find examples of stores/context usage
- **AND** they SHALL understand data flow patterns
