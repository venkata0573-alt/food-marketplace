# Branch protection for `main` (apply on GitHub)

Trunk-based development: **`main` is always deployable**. Configure the following on the default branch after the remote repository exists.

## Required settings

| Setting                                                          | Value                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Require a pull request before merging                            | Yes                                                                                           |
| Required approving reviews                                       | **1**                                                                                         |
| Dismiss stale pull request approvals when new commits are pushed | Recommended                                                                                   |
| Require status checks to pass before merging                     | Yes                                                                                           |
| Required checks                                                  | `Secret scan (gitleaks)`, `Lint, typecheck, test` (job names from `.github/workflows/ci.yml`) |
| Require branches to be up to date before merging                 | Yes                                                                                           |
| Require linear history                                           | **Yes** (squash merge only; no merge commits on `main`)                                       |
| Do not allow bypassing the above settings                        | Yes                                                                                           |
| Restrict who can push to matching branches                       | **No direct pushes** — nobody pushes to `main`; merge via PR only                             |
| Allow force pushes                                               | **Disabled**                                                                                  |
| Allow deletions                                                  | **Disabled**                                                                                  |

## Merge strategy

- **Squash merge only** for feature branches into `main`.
- Short-lived feature branches; delete branch after merge.

## Apply with GitHub CLI

When `gh` is authenticated and the repo remote is set:

```bash
./scripts/apply-branch-protection.sh
```

Or set manually: **Settings → Branches → Branch protection rules → `main`**.
