[![English](https://img.shields.io/badge/English-Click-yellow)](CONTRIBUTING.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](CONTRIBUTING_PL.md)

# Contributing Guidelines

## Standards

This project uses:

- [Conventional Branch](https://conventional-branch.github.io/en/v1.0.0/)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Universal Rules

See [AGENTS.md](AGENTS.md) for the 6 Universal Rules:

1. **TDD first:** Write the failing test before implementation
2. **Effect-based:** Domain uses `Effect<T,E,never>`; orchestration uses `Effect.gen` + `Context.Tag`
3. **Branded IDs:** Use branded types; never mix IDs across aggregates
4. **Never modify lint/type config:** Fix the actual code error, never disable rules or change ESLint, tsc, or other lint/type configuration to bypass errors
5. **No emojis in commits:** Use plain text for commit messages (no emoji prefixes like "🐛 fix:")
6. **GraphQL workflow:** Never edit generated GraphQL clients, types, or operations. Only edit Pothos schema files, then sync schema, then regenerate client

## How to Contribute

1. Create a branch
2. Make your changes (following TDD first and all universal rules above)
3. Open a pull request with a clear title and description of what changed and why
4. Request review
5. Squash and merge to main, with a conventional commit message
