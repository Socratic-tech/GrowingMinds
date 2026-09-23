# Statewide rollout checklist — Sept 2026

Branch: `rollout-statewide`. Do these **in order**. The app code expects the
database changes in step 2, so do steps 1 and 2 before step 4 (deploy).

## 1. Supabase settings (dashboard, ~15 min)

- [ ] **Custom SMTP — required before statewide signups.** Supabase's built-in
      email sender is for testing only. It only delivers to your own project
      team's addresses, and only a few messages an hour. Without custom SMTP,
      teachers won't get confirmation or password-reset emails.
      Set it under Authentication → Emails → SMTP Settings. Resend, Postmark,
      SendGrid and AWS SES all work, as does a district Microsoft 365/Google relay.
      Afterwards, raise the email rate limit under Authentication → Rate Limits.
- [ ] Authentication → URL Configuration: **Site URL** is
      `https://socratic-tech.github.io/GrowingMinds/`, and **Redirect URLs**
      include `https://socratic-tech.github.io/GrowingMinds/**`.
- [ ] Authentication → Providers → Email: decide whether **Confirm email** stays
      on (recommended). The sign-up page handles either setting.
- [ ] Optional: edit the Confirm signup email template (Authentication → Emails)
      so it says "Growing Minds" and not the Supabase default.
- [ ] Database → Publications → `supabase_realtime`: make sure **profiles** is
      enabled. That lets the Pending page and the Admin list update live.
      Posts, questions, answers and notifications should already be on.
- [ ] Plan limits: on the free plan the project pauses after about a week with
      no traffic. The keep-alive scheduled task covers this. The free plan also
      caps storage and live connections, which matters with hundreds of
      teachers online and uploading photos. Check the current numbers under
      Organization → Billing, and consider Pro for the school year.

## 2. Database migration (SQL Editor, ~5 min)

1. Open `supabase_rollout_2026-09.sql`.
2. Run **STEP 0** on its own (uncomment it). It's read-only and lists any
   duplicate tracker slots or maintenance tasks. Zero rows is expected.
3. Run the whole file. It's one transaction, so if anything fails, nothing
   changes. It's safe to re-run.
4. Run **STEP 6** (uncomment it). Each of the 9 tables should show 4 policies.

What it does:

- Adds name, school, district and REMC fields to profiles.
- Replaces the untracked access rules (RLS) with a reviewed, version-controlled set:
  - Classroom data is visible only to its owner.
  - Investigations are private, except templates.
  - Teachers can delete their own posts.
  - Pending accounts can't read anything.
- De-duplicates rows and adds unique constraints on tracker slots and maintenance tasks.
- Sends new-question notifications to approved educators only, using names instead of emails.

## 3. Check the settings

- [ ] `src/config/app.js` → `SUPPORT_CONTACT` is the address teachers should
      email for help. It appears on the sign-in, Pending and welcome screens.

## 4. Deploy and test (~20 min)

```bash
git checkout rollout-statewide
npm install
npm run deploy
```

Then, in an **incognito window**, run through the new-teacher path with a test email:

- [ ] Sign up with name, school and district. You should see the "Confirm your email" screen, and the email should arrive.
- [ ] Confirm the email and sign in. The Pending page should show "Submitted as …".
- [ ] As admin, the test account appears under Pending with its details. Approve it, and the incognito tab moves into the app on its own.
- [ ] The Welcome card appears. The tracker creates 30 slots. Log a maintenance date after 8pm and check it records *today's* date.
- [ ] Post, comment, then delete your own post. Ask a question, and the admin account gets a notification that shows the name.
- [ ] On a phone: you can reach Profile and Sign out from the avatar in the header, and the tracker's edit sheet opens on screen.
- [ ] Merge `rollout-statewide` into `main` and push.

## Known limits / later

- Admin is a single role statewide. Per-REMC admins, who approve only their own region, would be the next step if approvals pile up.
- The bundle is about 1 MB, a single file. Splitting code by route would speed up first load on slow school Wi-Fi.
- The unexplained `GrowingMinds` table and the storage bucket policies for `post-images` were not changed.
