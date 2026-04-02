## ADDED Requirements

### Requirement: Registered attendee has stable event-scoped QR identity
The system MUST generate and persist a stable attendee check-in identity token for each event registration, suitable for rendering as a participant QR code.

#### Scenario: Registration generates attendee QR identity
- **WHEN** a user successfully registers for an event
- **THEN** the system issues a stable registration-scoped check-in token for that user and event

### Requirement: Organizer verification code rotates over time
The system MUST generate organizer-facing verification codes that rotate on a fixed interval and are representable both as QR data and as a 6-digit OTP value.

#### Scenario: Organizer opens check-in screen
- **WHEN** an authorized organizer starts event check-in session
- **THEN** the system returns the current rotating code payload and expiration timestamp

#### Scenario: Code rotation after interval
- **WHEN** the current rotation interval elapses
- **THEN** the system invalidates the previous code and issues a new code for the next interval

### Requirement: Check-in requires valid attendee identity and active organizer code
The system MUST confirm attendance only when both attendee token and organizer rotating code are valid for the same event and active time window.

#### Scenario: Successful dual-code check-in
- **WHEN** organizer submits a registered attendee token with the currently valid organizer code
- **THEN** the system marks the user as attended for the event

#### Scenario: Rejected check-in with expired organizer code
- **WHEN** organizer submits an expired rotating code
- **THEN** the system MUST reject attendance confirmation

### Requirement: Attendance confirmation is idempotent and replay-safe
The system MUST prevent duplicate attendance confirmations for the same user and event.

#### Scenario: Duplicate check-in attempt
- **WHEN** an already attended user is submitted for check-in again
- **THEN** the system returns an idempotent already-attended result and does not increment attendance metrics
