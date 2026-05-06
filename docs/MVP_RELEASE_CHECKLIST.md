# Professional English Growth Hub MVP Release Checklist

## A. Product Scope

Professional English Growth Hub is an MVP single-user learning platform for structured professional English improvement. It supports planning, practice, assessment, progress tracking, teacher review, and local backup/restore.

The MVP is focused on a local browser-based experience with Mohamed Ashkar as the default profile while remaining configurable for other learners.

## B. Completed Features

- Dashboard with profile summary, smart recommendation, progress cards, today plan context, and quick actions
- Configurable learner profile, target level, goal, intensity, duration, daily minutes, study days, and focus areas
- Plan intensity options: Light, Standard, Intensive, Sprint
- Learning plan model with duration, months, weeks, days, and stable task IDs
- Daily Plan with selected month, week, day, editable day tasks, speaking topics, and task completion
- Speaking Topics Bank with search, category, difficulty, level, status, duration filters, notes, random topic, and progress
- Dynamic Mistakes system with add, edit, delete, search, filters, statuses, fixedAt behavior, and summaries
- Content Library with type tabs, search, filters, compact cards/list, and editable supported content
- Writing Practice Tracker
- Listening Practice Tracker
- Pronunciation Practice Tracker
- Configurable evaluation skills with weights
- Evaluation history with weighted average and weakest skill
- Level & Assessment with official level, suggested level, evidence, manual update, accept suggestion, and history
- Analytics summary cards
- Teacher Mode report with copyable report and teacher notes
- Data Management with reset, clear, export, copy backup JSON, import file, paste import, and restore default data
- Local Storage persistence and import normalization

## C. Core User Flows

### Flow 1: First-Time User

- Open the app.
- Confirm Dashboard loads.
- Review learner profile summary.
- Open Daily Plan.
- Complete one task.
- Refresh the browser.
- Confirm task completion remains saved.

### Flow 2: Evaluation Flow

- Open Evaluation.
- Save a weekly or monthly evaluation.
- Confirm average score is shown.
- Confirm weakest skill appears.
- Confirm Dashboard recommendation updates.
- Open Level & Assessment and confirm evidence updates.

### Flow 3: Speaking Practice Flow

- Open Speaking Topics.
- Search or filter topics.
- Select Random Topic.
- Mark a topic completed.
- Add notes.
- Refresh the browser.
- Confirm notes and completion persist.

### Flow 4: Mistakes Flow

- Open Mistakes.
- Add a mistake.
- Edit the mistake.
- Change status to Fixed.
- Confirm fixed date appears.
- Filter by category/status.
- Confirm summary counts update.

### Flow 5: Practice Tracker Flow

- Add one writing entry.
- Add one listening entry.
- Add one pronunciation entry.
- Confirm each tracker summary updates.
- Refresh and confirm entries persist.

### Flow 6: Teacher Mode Flow

- Open Teacher Mode.
- Review learner, level, skill, mistake, and practice summaries.
- Add teacher notes.
- Copy Teacher Report.
- Confirm notes persist after refresh.

### Flow 7: Backup Flow

- Open Data Management.
- Export JSON backup.
- Clear or restore default data after confirmation.
- Import the backup.
- Confirm profile, progress, evaluations, mistakes, tracker entries, and teacher notes are restored.

## D. QA Checklist

### Core

- [ ] App loads without runtime errors.
- [ ] Navigation works across all groups.
- [ ] Active section highlight works.
- [ ] Dashboard renders with meaningful data.
- [ ] No broken imports.
- [ ] No external icon library is used.

### Daily Plan

- [ ] Month selector works.
- [ ] Week selector works.
- [ ] Day selector works.
- [ ] Task checkboxes save.
- [ ] Daily plan edits save.
- [ ] Reset daily plan requires intentional action.

### Speaking

- [ ] Topic bank loads.
- [ ] Search works.
- [ ] Filters work.
- [ ] Random topic works.
- [ ] Completion saves.
- [ ] Notes save.

### Mistakes

- [ ] Add works.
- [ ] Edit works.
- [ ] Delete asks for confirmation.
- [ ] Status changes work.
- [ ] Fixed status sets fixedAt.
- [ ] Moving away from Fixed clears fixedAt.
- [ ] Filters work.

### Content Library

- [ ] Tabs work.
- [ ] Search works.
- [ ] Filters work.
- [ ] Editable content can be added/edited/deleted.
- [ ] Speaking topics are not duplicated.
- [ ] Mistakes use the shared mistakes source.

### Evaluation

- [ ] Evaluation saves.
- [ ] Weighted average calculates.
- [ ] Evaluation deletes.
- [ ] Custom skill settings save.
- [ ] Refresh preserves evaluations.

### Recommendation

- [ ] Smart recommendation renders.
- [ ] Empty data does not crash.
- [ ] Recommendation includes title, reason, action, and target section.

### Level & Assessment

- [ ] Official level is shown.
- [ ] Suggested level is shown.
- [ ] Accept Suggested Level works.
- [ ] Manual update works.
- [ ] History saves.

### Practice Trackers

- [ ] Writing add/edit/delete/search/filter works.
- [ ] Listening add/edit/delete/search/filter works.
- [ ] Pronunciation add/edit/delete/search/filter works.
- [ ] Summary cards update.

### Teacher Mode

- [ ] Report renders.
- [ ] Teacher notes save.
- [ ] Copy Teacher Report works or fallback text appears.

### Data Management

- [ ] Export JSON file works.
- [ ] Copy backup JSON works.
- [ ] Import invalid JSON shows an error.
- [ ] Import valid JSON restores data.
- [ ] Clear all data asks for confirmation.
- [ ] Restore defaults asks for confirmation.

### Responsive

- [ ] Desktop sidebar is usable.
- [ ] Mobile navigation is usable.
- [ ] Cards stack on mobile.
- [ ] Filter rows wrap on smaller screens.
- [ ] No major page-level horizontal overflow.

## E. Known Limitations

- Single-user local app only
- Data is stored in browser Local Storage
- No cloud sync
- No authentication
- No real teacher account or role-based access
- Suggested level is guidance, not official certification
- Recommendations are rule-based, not real-time AI-generated feedback
- Export/import is required for backup and device transfer
- Large data sets may eventually require pagination or a database

## F. Post-MVP Improvements

- Cloud database
- User accounts
- Teacher role/login
- Multi-learner teacher dashboard
- Admin role
- AI feedback for writing
- Speech recording and pronunciation scoring
- Calendar reminders
- PWA offline support
- Charts with advanced analytics
- Meeting transcript import
- Audio recording attachments
- Real CEFR assessment test
- Larger adaptive plan generation by duration/intensity

## G. Release Steps

1. Run `npm install`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run `npm run dev`.
5. Complete the core user flows above.
6. Export a test backup.
7. Import the test backup.
8. Confirm no major browser console errors.
9. Tag or archive the MVP release state.

## H. Manual Test Results Template

Tester:

Date:

Browser:

Device / viewport:

Build command result:

Lint command result:

Core flows tested:

- [ ] First-time user
- [ ] Evaluation
- [ ] Speaking
- [ ] Mistakes
- [ ] Practice trackers
- [ ] Teacher mode
- [ ] Backup/restore

Issues found:

Notes:

Release decision:

- [ ] Ready
- [ ] Ready with known limitations
- [ ] Not ready

## Final Acceptance Criteria

The MVP is ready if:

- App loads successfully
- Core navigation works
- User can complete daily tasks
- Progress persists after refresh
- Evaluation can be saved
- Recommendation appears
- Mistakes can be tracked
- Speaking topics can be practiced
- Writing/listening/pronunciation entries can be added
- Teacher report can be copied or fallback report text appears
- Data can be exported/imported
- No major console/runtime errors are observed
- Build succeeds
