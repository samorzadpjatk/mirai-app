---
title: "Admin Component Migration"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-migrate-admin-panel-to-astro-web/specs/admin-component-migration/spec.md"
parent_design: ".specs/plans/migrate-admin-panel-to-astro-web.design.md"
---

## ADDED Requirements

### Requirement: React Native to web primitive conversion

The system SHALL convert React Native UI primitives to HTML elements in all admin components.

#### Scenario: View to div conversion

- **WHEN** React Native View component is encountered
- **THEN** it is replaced with HTML div element

#### Scenario: Text to span conversion

- **WHEN** React Native Text component is encountered
- **THEN** it is replaced with HTML span or p element

#### Scenario: TouchableOpacity to button conversion

- **WHEN** React Native TouchableOpacity is encountered
- **THEN** it is replaced with HTML button element

#### Scenario: ScrollView to div conversion

- **WHEN** React Native ScrollView is encountered
- **THEN** it is replaced with scrollable div using CSS overflow

### Requirement: StyleSheet to CSS conversion

The system SHALL convert React Native StyleSheet styles to CSS modules or Tailwind classes.

#### Scenario: Inline styles converted

- **WHEN** StyleSheet.create is encountered
- **THEN** styles are converted to CSS module or Tailwind classes

#### Scenario: Flexbox layouts preserved

- **WHEN** React Native flexbox styles are converted
- **THEN** equivalent CSS flexbox properties are applied

#### Scenario: Platform-specific styles handled

- **WHEN** Platform.select is encountered
- **THEN** web-appropriate styles are selected and applied

### Requirement: Card components migration

The system SHALL migrate admin card components (UserCard, GroupCard, ChallengeCard, etc.) to web-compatible React components.

#### Scenario: Card component renders

- **WHEN** admin list page loads
- **THEN** migrated card components display data correctly

#### Scenario: Card interactions work

- **WHEN** user clicks card element
- **THEN** appropriate action (navigate, open modal) is triggered

#### Scenario: Card styling matches design

- **WHEN** card is rendered
- **THEN** visual appearance matches or improves upon mobile version

### Requirement: Modal components migration

The system SHALL migrate React Native modal components to web dialog/modal components.

#### Scenario: Modal opens

- **WHEN** user triggers modal action
- **THEN** modal dialog appears with backdrop

#### Scenario: Modal closes on backdrop click

- **WHEN** user clicks modal backdrop
- **THEN** modal closes and returns to previous state

#### Scenario: Modal content renders

- **WHEN** modal is open
- **THEN** form fields and content are displayed correctly

#### Scenario: Modal form submission

- **WHEN** user submits modal form
- **THEN** data is saved and modal closes

### Requirement: Form components migration

The system SHALL migrate form components (input fields, selects, date pickers) to web-native form elements.

#### Scenario: Text input fields

- **WHEN** form is rendered
- **THEN** HTML input elements are used with proper labels

#### Scenario: Select dropdowns

- **WHEN** dropdown is needed
- **THEN** HTML select element or custom dropdown component is used

#### Scenario: Date pickers

- **WHEN** date selection is needed
- **THEN** web-compatible date picker (native or library) is used

#### Scenario: Form validation

- **WHEN** user submits invalid form
- **THEN** validation errors are displayed inline

### Requirement: Image components migration

The system SHALL migrate React Native Image components to HTML img elements with proper loading and error handling.

#### Scenario: Image displays

- **WHEN** component with image is rendered
- **THEN** HTML img element loads and displays image

#### Scenario: Image loading state

- **WHEN** image is loading
- **THEN** loading placeholder or skeleton is shown

#### Scenario: Image error handling

- **WHEN** image fails to load
- **THEN** fallback image or error state is displayed

### Requirement: Navigation migration

The system SHALL replace React Native navigation with Astro routing and web-native navigation patterns.

#### Scenario: Link navigation

- **WHEN** user clicks navigation link
- **THEN** Astro router navigates to new page

#### Scenario: Programmatic navigation

- **WHEN** component triggers navigation
- **THEN** browser history API or Astro navigate function is used

#### Scenario: Back navigation

- **WHEN** user clicks back button
- **THEN** browser back functionality works as expected

### Requirement: Admin hooks compatibility

The system SHALL maintain compatibility of admin hooks (useAdminUsers, useAdminChallenges, etc.) with minimal changes.

#### Scenario: Hook imports work

- **WHEN** component uses admin hook
- **THEN** hook is imported and functions correctly in web environment

#### Scenario: Data fetching works

- **WHEN** hook fetches data via tRPC
- **THEN** data is loaded and returned to component

#### Scenario: Hook state management

- **WHEN** hook manages loading/error states
- **THEN** states are updated correctly for web components
