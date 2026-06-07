# Analysis: React Query Persistence + Offline Mutation Queue

## 1. Architecture Fit

### Current Stack Compatibility
- **React Query v5**: Supports `networkMode: 'offlineFirst'` and `persistQueryClient` natively
- **oRPC**: Mutation options pattern (`orpc.xxx.mutationOptions()`) compatible with wrapper hooks
- **Expo React Native**: `AsyncStorage` persister works; `expo-task-manager` available for background sync
- **Zustand**: Ideal for queue state management (lightweight, no provider needed)

### Approach 1 vs Alternatives
| Approach | Effort | Offline Read | Offline Write | Conflict Resolution | Backend Changes |
|----------|--------|------------|-------------|---------------------|-----------------|
| **RQ Persistence + Queue** (selected) | 2-4 weeks | Yes | Yes (queued) | Last-Write-Wins | None |
| ElectricSQL/PowerSync | 6-8 weeks | Yes | Yes (real-time) | Built-in | Schema changes |
| Custom SQLite Layer | 4-6 weeks | Yes | Yes | Manual | None |

**Selection rationale**: No backend changes needed, fits existing RQ patterns, 2-4 week timeline achievable.

## 2. Codebase Impact Assessment

### Files Requiring Changes
| File | Change Type | Lines Est. | Risk |
|------|-------------|------------|------|
| `packages/orpc/src/client/query-client-factory.ts` | Modify | +10 | Low |
| `packages/orpc/src/client/query-client.tsx` | Modify | +15 | Low |
| `apps/native/src/app/_layout.tsx` | Modify | +5 | Low |
| `apps/native/package.json` | Add deps | +3 | Low |
| `packages/orpc/package.json` | Add deps | +2 | Low |
| `apps/native/src/hooks/challenges/useChallengeCapture.ts` | Wrap mutation | +20 | Medium |
| `apps/native/src/hooks/groups/useCreateGroup.ts` | Wrap mutation | +15 | Medium |
| `apps/native/src/hooks/groups/useGroupEditor.ts` | Wrap mutations | +25 | Medium |
| `apps/native/src/hooks/trips/useTripDetails.ts` | Add persist key | +5 | Low |
| `apps/native/src/hooks/trips/useTrips.ts` | Add persist key | +5 | Low |
| `apps/native/src/hooks/groups/useGroups.ts` | Add persist key | +5 | Low |
| `apps/native/src/hooks/challenges/useChallenges.ts` | Add persist key | +5 | Low |

### New Files to Create
| File | Purpose | Lines Est. |
|------|---------|------------|
| `packages/orpc/src/client/persister.ts` | AsyncStorage persister config | ~20 |
| `apps/native/src/services/offline/storage.ts` | Queue AsyncStorage CRUD | ~60 |
| `apps/native/src/services/offline/queueProcessor.ts` | Queue processing logic | ~80 |
| `apps/native/src/services/offline/errorClassifier.ts` | Mutation error classification | ~30 |
| `apps/native/src/stores/offlineQueueStore.ts` | Zustand queue state | ~40 |
| `apps/native/src/hooks/offline/useOfflineMutation.ts` | Wrapper hook | ~50 |
| `apps/native/src/hooks/offline/useOfflineQueue.ts` | Queue status hook | ~30 |
| `apps/native/src/hooks/offline/useNetworkStatus.ts` | NetInfo wrapper | ~20 |
| `apps/native/src/components/offline/OfflineStatusBar.tsx` | Offline indicator | ~40 |
| `apps/native/src/components/offline/PendingBadge.tsx` | Pending badge | ~25 |
| `apps/native/src/services/background/offlineSyncTask.ts` | Background sync task | ~50 |

**Total estimated new code**: ~445 lines
**Total estimated modified code**: ~113 lines

## 3. Conflict Analysis Integration

### Mutations That CANNOT Be Offline
Per `.specs/plans/conflict-scenarios-comprehensive.analysis.md`:

| Mutation | Reason | File |
|----------|--------|------|
| `banUserUntil` | Supabase auth API - external | `packages/orpc/src/api/routers/user/mutations.ts` |
| `deleteUser` | Transactional, high risk | `packages/orpc/src/api/routers/user/mutations.ts` |
| `forceEndJudgedStaffVoting` | Affects all groups | `packages/orpc/src/api/routers/challengeVote/mutations.ts` |
| `purchaseReward` | Inventory + coins atomicity | `packages/orpc/src/api/routers/reward/mutations.ts` |
| `addCoins` | Read-modify-write, lost update risk | `packages/orpc/src/api/routers/group/mutations.ts` |
| `submitVotes` | Immutable-after-write rule | `packages/orpc/src/api/routers/challengeVote/mutations.ts` |
| `respondToJoinRequest` | Cascading transaction | `packages/orpc/src/api/routers/group/mutations.ts` |
| `updateWristNumber` | Unique constraint violation risk | `packages/orpc/src/api/routers/user/mutations.ts` |

### Mutations That CAN Be Offline (Phase 1)
| Mutation | Risk | Mitigation |
|----------|------|------------|
| `updateMyProfile` | Low | Last-Write-Wins acceptable |
| `updateAvatar` | Low | Last-Write-Wins acceptable |
| `updateHouseNumber` | Low | No unique constraints |
| `updateLocation` | Low | Time-series, LWW OK |
| `requestToJoin` | High | Queue, may fail on sync with unique constraint - show error |
| `challengeSubmission.create` | Critical | Queue, handle "already submitted" on sync |
| `group.create` | Critical | Queue, server-side code allocation needed eventually |
| `group.update` | Medium | Last-Write-Wins |
| `group.join` | Critical | Queue, may fail if already in group |
| `group.leave` | High | Queue, may fail if group deleted |

## 4. Technical Decisions

### Storage Choice: AsyncStorage vs SQLite
- **Decision**: AsyncStorage for Phase 1
- **Rationale**: Simpler, no native module changes, sufficient for queue of <100 items
- **Future**: Migrate to `expo-sqlite` if queue grows or needs complex querying

### Queue Ordering: FIFO vs Priority
- **Decision**: FIFO with retry count
- **Rationale**: Simpler, matches user expectation (first action first)
- **Future**: Add priority for critical actions (e.g., challenge submissions before profile updates)

### Optimistic Updates: Immediate vs Delayed
- **Decision**: Immediate for Phase 1
- **Rationale**: Better UX, React Query cache makes rollback straightforward
- **Risk**: Rollback may flash incorrect data briefly

### Background Sync: expo-task-manager vs App State
- **Decision**: Both
- **Rationale**: `expo-task-manager` for periodic sync when backgrounded, NetInfo listener for immediate sync when foregrounded

## 5. Testing Strategy

### Unit Tests
- `offlineQueueStore.test.ts`: Add/remove/clear mutations
- `queueProcessor.test.ts`: FIFO order, retry logic, error classification
- `useOfflineMutation.test.ts`: Wrap mutation, queue on error, remove on success
- `errorClassifier.test.ts`: Classify network vs validation vs server errors

### Integration Tests
- `offline-flow.test.tsx`: Offline -> online transition, queue processing
- `persistence.test.tsx`: Query cache survives unmount/remount

### E2E Tests
- Complete offline flow: view trip -> submit challenge -> online -> verify
- Profile update offline -> online -> verify
- Queue overflow: add 101 mutations -> verify oldest discarded

## 6. Rollback Plan

If implementation fails or timeline slips:
1. **Week 2 checkpoint**: If persistence not working, pivot to simpler `AsyncStorage` manual cache
2. **Week 3 checkpoint**: If queue too complex, scope down to "offline read only" (no mutation queue)
3. **Always**: Keep changes behind feature flag until Phase 1 complete

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Offline read coverage | 80% screens | Manual test: put phone in airplane mode, verify screens load |
| Mutation success rate | 99% | Log queue processing: success / total queued |
| Time to sync | <5s median | Log timestamp: online detected -> queue empty |
| App startup with cache | <2s | Measure from launch to first render with cached data |

## 8. Dependencies & Blockers

### No Blockers
- All required packages available on npm
- No backend changes needed
- No schema migrations needed

### Optional Enhancements (Future Phases)
- Server-side delta sync endpoints (requires backend work)
- Schema versioning for queue entries
- Server-side allocation for `groups.code` and `wristNumber`
