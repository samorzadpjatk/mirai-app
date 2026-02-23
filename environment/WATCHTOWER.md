# Watchtower Auto-Update Configuration

This directory contains the Docker Compose configuration with Watchtower integration for automatic container updates.

## Overview

The setup includes two Watchtower instances to ensure proper update order:

1. **watchtower-db** - Updates database migrations first
2. **watchtower-backend** - Updates backend services after migrations

## Update Schedule

- **Database Migrations**: Daily at 2:00 AM
- **Backend Services**: Daily at 3:00 AM (1 hour after migrations)

## Scopes and Labels

### Database Migration Scope
- **Scope**: `db-migrations`
- **Monitored Services**: `db-migrations`
- **Purpose**: Ensures database schema changes are applied before application updates

### Backend Services Scope
- **Scope**: `backend-services`
- **Monitored Services**: `backend-server`, `notification-sender`
- **Purpose**: Updates application services after database changes are complete

## Lifecycle Hooks

Each service includes lifecycle hooks that provide logging during updates:

- **pre-update**: Logs when an update is starting
- **post-update**: Logs when an update is completed

## Configuration Details

### Watchtower Features Used

- **Scope-based filtering**: Separate instances for different update phases
- **Rolling restart**: Updates one container at a time
- **Label enable**: Only monitors containers with explicit labels
- **Cleanup**: Removes old images after updates
- **Polling**: Hourly checks as fallback to scheduled updates

### Safety Features

- **Graceful shutdown**: 60-second timeout for backend services
- **Dependency ordering**: Backend watchtower depends on database watchtower
- **Health checks**: Containers must be healthy before updates

## Manual Updates

To trigger manual updates:

```bash
# Update database migrations only
docker exec watchtower-db watchtower --scope db-migrations --run-once

# Update backend services only  
docker exec watchtower-backend watchtower --scope backend-services --run-once
```

## Monitoring

Watchtower logs can be viewed with:

```bash
# Database migration updates
docker logs -f watchtower-db

# Backend service updates
docker logs -f watchtower-backend
```

## Environment Variables

Key watchtower environment variables:

- `WATCHTOWER_SCOPE`: Defines which containers to monitor
- `WATCHTOWER_SCHEDULE`: Cron expression for update timing
- `WATCHTOWER_ROLLING_RESTART`: Enables one-at-a-time updates
- `WATCHTOWER_LABEL_ENABLE`: Only monitors labeled containers
- `WATCHTOWER_CLEANUP`: Removes old images after updates
- `WATCHTOWER_POLL_INTERVAL`: Fallback polling interval
- `WATCHTOWER_TIMEOUT`: Graceful shutdown timeout

## Troubleshooting

1. **Containers not updating**: Verify labels are correctly set
2. **Update failures**: Check watchtower logs for error messages
3. **Timing issues**: Ensure sufficient time between migration and backend updates
4. **Permission errors**: Verify Docker socket access for watchtower containers
