# Naming Conventions

> Language-specific naming convention tables. Use the appropriate table when scaffolding CLAUDE.md.

## TypeScript / JavaScript

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `user-service.ts` |
| Directories | kebab-case | `api-handlers/` |
| Functions | camelCase | `getUserById()` |
| Variables | camelCase | `isActive` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Classes | PascalCase | `UserService` |
| Interfaces | PascalCase | `UserProfile` |
| Type aliases | PascalCase | `ApiResponse` |
| Enums | PascalCase | `UserRole` |
| Enum values | PascalCase | `UserRole.Admin` |
| React components | PascalCase | `UserCard.tsx` |
| Test files | kebab-case + suffix | `user-service.test.ts` |

## Python

| Element | Convention | Example |
|---------|-----------|---------|
| Files | snake_case | `user_service.py` |
| Directories | snake_case | `api_handlers/` |
| Functions | snake_case | `get_user_by_id()` |
| Variables | snake_case | `is_active` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Classes | PascalCase | `UserService` |
| Private methods | _prefix | `_validate_input()` |
| Dunder methods | __wrap__ | `__init__()` |
| Modules | snake_case | `data_processing` |
| Test files | snake_case + prefix | `test_user_service.py` |

## Rust

| Element | Convention | Example |
|---------|-----------|---------|
| Files | snake_case | `user_service.rs` |
| Directories | snake_case | `api_handlers/` |
| Functions | snake_case | `get_user_by_id()` |
| Variables | snake_case | `is_active` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Structs | PascalCase | `UserService` |
| Enums | PascalCase | `UserRole` |
| Enum variants | PascalCase | `UserRole::Admin` |
| Traits | PascalCase | `Serializable` |
| Macros | snake_case! | `vec![]` |
| Lifetimes | short lowercase | `'a`, `'ctx` |
| Test modules | `tests` | `mod tests` |

## Go

| Element | Convention | Example |
|---------|-----------|---------|
| Files | snake_case | `user_service.go` |
| Directories | lowercase | `apihandlers/` |
| Packages | lowercase | `userservice` |
| Exported functions | PascalCase | `GetUserByID()` |
| Unexported functions | camelCase | `validateInput()` |
| Exported types | PascalCase | `UserService` |
| Unexported types | camelCase | `userConfig` |
| Constants | PascalCase or UPPER_SNAKE | `MaxRetries` |
| Interfaces | PascalCase + -er | `Reader`, `Stringer` |
| Test files | suffix | `user_service_test.go` |
| Acronyms | ALL CAPS | `HTTPClient`, `GetUserID` |

## General Rules

- **Be consistent** — pick one convention per element type and stick to it
- **Follow the codebase** — existing conventions override these defaults
- **Match the ecosystem** — use what the language community expects
- **Be descriptive** — `getUserById` beats `getUser`, `u`, or `fetchData`
