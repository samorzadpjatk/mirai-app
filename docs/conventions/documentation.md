# Documentation & Reflection Best Practices

## When to Update

- New features, API changes, refactoring, bug fixes revealing gaps

## Priority (highest first)

1. **Onboarding blockers** - Setup instructions, quick start
2. **API documentation** - Endpoints, auth (`/docs:update-docs api`)
3. **Module READMEs** - Purpose, navigation (`/docs:update-docs src/<module>/`)
4. **Troubleshooting** - Common errors
5. **Architecture decisions** - Why, not what
6. **JSDoc** - Complex logic with examples

## Signs Docs Need Updating

- "How do I...?" questions in issues
- Setup instructions don't work
- API doesn't match docs
- No docs for new features

## Reflection

```
# After major features
/reflexion:reflect
/reflexion:memorize "Pattern: Use Redis pub/sub for real-time events"
```

**Memorize**: New patterns, gotchas, better approaches, tooling quirks

## Complete Workflow

```
# 1. Implement
claude "add user preferences"
# 2. Reflect
/reflexion:reflect
# 3. Test
/tdd:write-tests
# 4. Review
/review-local-changes
# 5. Document
/docs:update-docs
# 6. Memorize
/reflexion:memorize "Validate preferences against schema before saving"
# 7. Commit
/git:commit
```

---

## Using AGENTS.md Effectively

**At start of session**:
```
Read AGENTS.md and follow its guidelines
```

**After major feature**:
```
# Reflect on implementation lessons
/reflect

# Memorize key insights to AGENTS.md
/memorize
```

**When to update AGENTS.md**:
- New patterns emerge that should be standardized
- Gotchas or pitfalls discovered
- Workflow improvements validated
- Tooling or environment changes

---

## Fluid vs Rigid: When to Break the Rules

The workflow is a guide, not a prison. Be fluid when:

✅ **OK to skip phases**:
- Emergency hotfixes: `/sadd:do-and-judge` directly
- Trivial changes: Skip formal proposal, use `/sdd:add-task` directly
- Well-understood problems: Skip exploration, go straight to specification

⚠️ **NOT OK to skip**:
- Judge verification on production code
- Spec alignment check before archive
- Context clearing between planning and implementation
- Final review before commit

**Guideline**: Skip documentation phases when speed matters. Never skip quality gates.

---

## Combining Plugins for Maximum Quality

For the highest quality results, combine multiple CEK plugins:

```
# 1. Create task with DDD context
/sdd:add-task "Add OAuth2 authentication"

# 2. Plan following Clean Architecture principles (DDD plugin)
/sdd:plan-task

# 3. Implement following DDD and SOLID principles
/sdd:implement-task

# 4. Multi-agent review (review plugin)
/review-local-changes

# 5. Fix any issues found (sadd plugin)
/sadd:do-in-steps "Fix issues from review"

# 6. Reflect on implementation (reflexion plugin)
/reflexion:reflect

# 7. Update documentation (docs plugin)
/docs:update-docs

# 8. Memorize insights to AGENTS.md (reflexion plugin)
/reflexion:memorize "Key pattern learned from this implementation"

# 9. Create PR with proper formatting (git plugin)
/git:create-pr
```

**Benefit**: Each plugin brings specialized agents and quality gates. Combined, they provide comprehensive coverage across architecture, implementation, review, documentation, and delivery.

## Related Documentation

- [AI-Driven Change Workflow](../workflows/ai-change-workflow.md) - Complete workflow with Phase 6 (Documentation)
- [Best Practices & Patterns](best-practices.md) - General workflow patterns
