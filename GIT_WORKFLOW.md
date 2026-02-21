# Git Workflow — Team of 4

## Branch Naming Strategy

```
main              ← production-ready, protected
develop           ← integration branch
feature/<name>    ← new features      (e.g., feature/user-auth)
fix/<name>        ← bug fixes         (e.g., fix/login-redirect)
hotfix/<name>     ← urgent prod fixes (e.g., hotfix/db-connection)
```

### Rules
- `main` is **always deployable** — no direct pushes
- `develop` is the **integration target** for all features
- Feature branches are created **from `develop`**
- Hotfix branches are created **from `main`** and merged back to both `main` and `develop`

---

## Commit Message Convention

Format: `<type>(<scope>): <short description>`

### Types
| Type       | Use                     |
|------------|-------------------------|
| `feat`     | New feature             |
| `fix`      | Bug fix                 |
| `docs`     | Documentation change    |
| `style`    | Formatting, no logic    |
| `refactor` | Code restructuring      |
| `test`     | Adding/updating tests   |
| `chore`    | Build, config, tooling  |

### Examples
```
feat(items): add pagination to items list
fix(api): handle null description in item update
docs(readme): add Docker setup instructions
test(items): add delete endpoint edge cases
chore(docker): optimize frontend build stage
```

---

## PR Rules

1. **Title**: Use commit convention format
2. **Description**: Include what changed, why, and how to test
3. **Size**: Keep PRs small (< 400 lines changed)
4. **Reviews**: Minimum 1 approval required
5. **Checks**: All tests must pass before merging
6. **Merge Strategy**: Squash merge to keep history clean

### PR Template

```markdown
## What
Brief description of changes.

## Why
Context and motivation.

## How to Test
1. Step-by-step verification instructions

## Checklist
- [ ] Tests pass locally
- [ ] No console errors
- [ ] Swagger docs updated (if API changed)
```

---

## Team Workflow (4 Members)

### Suggested Role Split
| Member | Area            | Branch Prefix          |
|--------|-----------------|------------------------|
| Dev 1  | Backend API     | `feature/api-*`        |
| Dev 2  | Frontend UI     | `feature/ui-*`         |
| Dev 3  | Database/Infra  | `feature/db-*`         |
| Dev 4  | Integration/QA  | `feature/integration-*`|

### Daily Flow
1. Pull latest `develop`
2. Create feature branch
3. Commit frequently with meaningful messages
4. Push branch and open PR to `develop`
5. Get review from at least one teammate
6. Squash merge into `develop`
7. Delete feature branch

### Release Flow
```
develop → PR → main (tag vX.Y.Z)
```
