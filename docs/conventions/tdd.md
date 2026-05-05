# Test-Driven Development (TDD) Best Practices

**The Iron Law of TDD**:
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

## The Red-Green-Refactor Cycle

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│   RED   │────▶│  GREEN  │────▶│ REFACTOR│
│Write    │     │Minimal  │     │Clean up │
│failing  │     │code to  │     │while    │
│test     │     │pass     │     │green    │
└─────────┘     └─────────┘     └────┬────┘
     │                               │
     │                               │
     └───────────────────────────────┘
                (repeat)
```

## Why Order Matters

1. **Write test first** - Forces you to think about what you're testing before implementation
2. **Watch it fail** - Proves the test actually tests something (catches wrong assertions)
3. **Minimal code to pass** - Prevents over-engineering
4. **Refactor safely** - Tests prove behavior preserved

## TDD Anti-Patterns

| Anti-Pattern | The Problem | The Fix |
|--------------|-------------|---------|
| **Testing mocks** | Verifying mock was called, not that code works | Test real behavior, minimize mocks |
| **Test-only methods** | Production code polluted with methods only tests use | Move cleanup to test utilities |
| **Mock without understanding** | Mock breaks test logic by removing side effects | Understand dependencies before mocking |
| **Tests after code** | Tests passing immediately proves nothing | Delete code, start over with test first |
| **Keep "reference" code** | Adapting existing code while writing tests | Delete it. Start fresh from tests. |

## When to Use TDD

**Always**:
- New features
- Bug fixes (write test reproducing bug first)
- Refactoring (ensure tests exist before changing code)
- Behavior changes

**Integration with SDD**:
When using `/sdd:implement-task`, TDD is automatically applied:
- Each step includes test-first development
- Tests written before production code
- Judge verification includes test quality checks

## Anti-Patterns to Avoid

- ❌ "Too simple to test" - Simple code breaks. Tests take 30 seconds.
- ❌ "I'll test after" - Tests passing immediately prove nothing.
- ❌ "Deleting X hours is wasteful" - Sunk cost. Unverified code = technical debt.
- ❌ "TDD is dogmatic" - TDD IS pragmatic: finds bugs before commit.

## TDD Checklist

Before marking complete:
- [ ] Every function has a test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass
- [ ] All tests pass, output pristine
- [ ] Edge cases covered

Can't check all boxes? **You skipped TDD. Start over.**

## Related Documentation

- [AI-Driven Change Workflow](../workflows/ai-change-workflow.md) - Complete workflow with TDD integration
- [Best Practices & Patterns](best-practices.md) - General workflow patterns
