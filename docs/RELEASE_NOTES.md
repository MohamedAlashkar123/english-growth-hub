# Release Notes

## MVP v1.0

Professional English Growth Hub MVP v1.0 is a configurable local learning platform for structured professional English growth. It supports planning, skill practice, evaluation, mistakes tracking, recommendations, analytics, teacher reporting, and JSON backup/restore.

## Summary

This release turns the original fixed English dashboard into a configurable learning platform with Mohamed Ashkar as the default learner profile. The app is ready for local MVP use and structured manual QA.

## Main Features

- Professional dashboard with smart recommendation and quick actions
- Configurable learner profile and plan intensity
- Month/week/day learning plan structure
- Editable daily plan tasks and speaking topics
- Large speaking topics bank with search, filters, random topic, notes, and completion tracking
- Dynamic mistakes system
- Organized Content Library
- Writing, listening, and pronunciation practice trackers
- Configurable evaluations and weighted average score
- Level & Assessment with official and suggested level
- Analytics summary
- Teacher Mode report with teacher notes and copyable report text
- Local Storage persistence
- JSON export/import backup and restore

## Known Limitations

- Single-user local app only
- Browser Local Storage is the only persistence layer
- No cloud sync or account login
- No real teacher login or role permissions
- Suggested levels are guidance only, not official CEFR certification
- Recommendations are rule-based and explainable, not live AI-generated feedback
- Backups must be exported/imported manually for device transfer

## Recommended Next Improvements

- Cloud database and user accounts
- Teacher role with multi-learner dashboard
- AI writing correction and feedback
- Speech recording and pronunciation scoring
- Calendar reminders and streaks
- PWA offline install
- Advanced charts and long-term trends
- Transcript and audio attachment support
- Real CEFR placement and reassessment flow

## How To Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## How To Back Up Data

1. Open Data Management.
2. Select Export to JSON file or Copy backup JSON.
3. Store the generated JSON file or copied JSON in a safe location.

## How To Restore Data

1. Open Data Management.
2. Import from a JSON file or paste backup JSON.
3. Confirm that current local data should be replaced.
4. Verify profile, progress, evaluations, mistakes, tracker entries, and teacher notes after import.

## MVP Release Verification

Last automated verification for this release pass:

- `npm run lint`: passed
- `npm run build`: passed
