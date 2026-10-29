---
name: git-workflow
description: >-
  Standard Git operations, Conventional Commits formatting, branch management, and GitHub synchronization procedure for Visualizor.
---

# Visualizor Git & GitHub Workflow

Use this skill whenever staging, committing, branching, or pushing changes to GitHub for Visualizor.

## 1. Commit Message Convention (Conventional Commits)

All commit messages must follow the standard structure:
```
<type>(<scope>): <short description in present tense>

[optional body explaining motivation and context]
```

### Commit Types:
* `feat`: A new feature (e.g. `feat(preset): add Black Hole gravitational lensing preset`)
* `fix`: A bug fix (e.g. `fix(audio): resolve audio context suspension on mobile safari`)
* `perf`: Performance optimization (e.g. `perf(render): merge post-processing passes into master shader`)
* `refactor`: Code refactoring without changing functionality
* `style`: UI layout, styling, and animations
* `docs`: Documentation, README, or skill guides
* `test`: Adding or updating tests
* `chore`: Build scripts, dependencies, configuration

## 2. Standard Git Commands

* **Check Working Tree & Status**:
  ```powershell
  git status
  ```
* **Stage Specific Files**:
  ```powershell
  git add src/presets/NewPreset.ts src/presets/index.ts
  ```
* **Commit**:
  ```powershell
  git commit -m "feat(preset): add MatrixRain falling code stream"
  ```
* **Configure Remote & Push to GitHub**:
  ```powershell
  # If remote is not yet added:
  git remote add origin https://github.com/<username>/visualizor.git
  git branch -M main
  git push -u origin main
  ```

## 3. Pre-Push Safety Checklist

* [ ] Ensure `.gitignore` ignores `node_modules/`, `dist/`, `_ref_dump/`, and local caches.
* [ ] Verify that `npx tsc --noEmit` and `npm run build` pass with zero errors.
* [ ] Verify that no private tokens, passwords, or personal keys are included.
