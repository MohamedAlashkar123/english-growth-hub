# Professional English Growth Hub

Professional English Growth Hub is a configurable React learning platform for structured professional English improvement. It helps a learner plan study, practice core skills, track evidence, review progress, and prepare a teacher-ready report.

## Key Features

- Configurable learner profile, level, target level, goal, intensity, and study rhythm
- Structured learning plan with month, week, day, and task tracking
- Speaking topics bank with search, filters, notes, completion status, and random topic selection
- Dynamic mistakes system with add, edit, delete, status tracking, and correction evidence
- Content Library for grammar, speaking, business phrases, pronunciation, writing templates, and mistakes
- Writing, listening, and pronunciation practice trackers
- Configurable evaluation skills with weighted averages
- Level & Assessment page with official level, suggested level, evidence, and history
- Rule-based smart recommendation on the dashboard
- Analytics and teacher mode report
- Local backup and restore through JSON export/import

## Tech Stack

- Vite
- React
- Tailwind CSS
- Browser Local Storage for persistence

No external icon libraries are used. The UI uses text, emoji icons, and Tailwind styling.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

Optional preview:

```bash
npm run preview
```

## Data Persistence

All learner configuration and progress are stored in the browser's Local Storage. Data remains after refresh and browser restart on the same browser profile.

Because this is a local MVP, data is not synced to the cloud. Use the Data section to export a JSON backup regularly.

## Backup And Restore

To back up:

1. Open Data Management.
2. Select Export to JSON file or Copy backup JSON.
3. Store the backup file safely.

To restore:

1. Open Data Management.
2. Import from a JSON file or paste backup JSON.
3. Confirm replacement of the current local data.

## MVP Limitations

- Single-user local app only
- No authentication or teacher login
- No cloud sync or database
- Suggested level is guidance, not official certification
- Recommendations are rule-based, not live AI feedback
- Export/import is required for backup or device transfer

## Future Roadmap

- Cloud database and account login
- Multi-learner teacher dashboard
- Teacher/admin roles
- AI writing feedback
- Speech recording and pronunciation scoring
- Calendar reminders and study streaks
- PWA offline install
- Advanced charts and trend analytics
- Meeting transcript import
- Audio attachment support
- Real CEFR assessment flow
