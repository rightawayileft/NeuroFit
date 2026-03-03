# Bugfix Log

## 2026-03-03

### Fixed
- Resolved a Progress tab crash caused by an undefined `pts` reference in the weight trend chart.
- Fixed inline workout set editing so numeric inputs autofocus correctly and pressing Enter commits the value.
- Replaced empty-state faux buttons in Progress charts with real buttons so keyboard activation works.
- Re-enabled mobile zoom by removing the restrictive viewport scaling settings.
- Fixed journal auto-tagging so entries capture the active split and exercise context.
- Routed journal deletion through the shared storage helper instead of raw `localStorage`.
- Added `LS.remove()` to the storage helper for consistent deletion behavior.
- Fixed workout history cardio rendering to support the stored array-based cardio log shape.

### Verification
- `npm run build` succeeded.
- Local Playwright verification confirmed:
  - Progress renders with two days of body data.
  - Keyboard activation works for "Switch to Today".
  - Enter commits values in the workout set editor.
