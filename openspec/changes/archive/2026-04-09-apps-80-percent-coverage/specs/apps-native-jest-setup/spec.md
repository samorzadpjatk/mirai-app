## ADDED Requirements

### Requirement: Jest configuration shall be created for React Native app

The system SHALL create `apps/native/jest.config.js` with jest-expo preset and proper monorepo integration.

#### Scenario: Jest config uses jest-expo preset

- **WHEN** examining apps/native/jest.config.js
- **THEN** it SHALL extend jest-expo preset
- **AND** it SHALL support TypeScript files
- **AND** it SHALL handle Expo modules

#### Scenario: Jest config handles monorepo structure

- **WHEN** running Jest from apps/native/
- **THEN** workspace dependencies SHALL be resolved
- **AND** path mapping SHALL work for ~ imports
- **AND** node_modules SHALL be properly handled

#### Scenario: Jest supports React Native specific features

- **WHEN** testing with Jest
- **THEN** NativeModules SHALL be mockable
- **AND** Platform (iOS/Android) SHALL be configurable
- **AND** Image assets SHALL be stubbed

### Requirement: Jest test environment shall support Expo modules

The system SHALL configure Jest to properly mock Expo-specific modules (expo-location, expo-notifications, etc.).

#### Scenario: Expo location module is mocked

- **WHEN** importing expo-location in tests
- **THEN** mock implementations SHALL be available
- **AND** requestForegroundPermissionsAsync SHALL be mockable
- **AND** getCurrentPositionAsync SHALL be mockable

#### Scenario: Expo notifications module is mocked

- **WHEN** importing expo-notifications in tests
- **THEN** mock implementations SHALL be available
- **AND** scheduleNotificationAsync SHALL be mockable
- **AND** getPermissionsAsync SHALL be mockable

#### Scenario: Expo camera module is mocked

- **WHEN** importing expo-camera in tests
- **THEN** mock implementations SHALL be available
- **AND** Camera component SHALL be mockable
- **AND** camera permissions SHALL be mockable

### Requirement: Jest shall integrate with package.json scripts

The system SHALL update `apps/native/package.json` to include Jest test commands.

#### Scenario: Test command runs Jest

- **WHEN** running "bun test" from apps/native/
- **THEN** Jest SHALL execute
- **AND** all test files SHALL be discovered

#### Scenario: Coverage command generates reports

- **WHEN** running "bun run test:coverage"
- **THEN** Jest coverage report SHALL be generated
- **AND** lcov or json format SHALL be output

#### Scenario: Watch mode is available

- \*\*WHEN" running "bun run test:watch"
- **THEN** Jest watch mode SHALL start
- **AND** file changes SHALL trigger re-runs
