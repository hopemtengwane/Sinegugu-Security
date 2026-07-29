SINEGUGU SECURITY WEBSITE — VERSION 11

This version uses Supabase for shared slideshow, news, uploaded images and website settings.
The GitHub Pages site and the Wix-embedded site now read the same online data.

INITIAL SETUP
1. Open Supabase Dashboard > SQL Editor.
2. Run the complete supabase-setup.sql file once.
3. Open Supabase Dashboard > Authentication > Users.
4. Add an administrator user with an email address and strong password.
5. Upload every file in this package to the root of the GitHub repository, replacing older files.
6. Wait for GitHub Pages to redeploy.
7. Open /admin.html and sign in with the Supabase administrator account.

MIGRATING THE EXISTING NEWS AND SLIDES
1. Open admin.html directly on the same GitHub Pages address previously used for editing.
2. Sign in.
3. Open Backup / migration.
4. Click “Migrate earlier browser content”.
5. Open Hero slideshow and click “Save slideshow”.
6. Open News and click “Save news”.
7. Open Settings and click “Save settings”.

The old long news text is moved into the Full article field and a short card summary is created automatically.

NEWS
- Summary appears on the equal-height carousel card.
- Full article opens through the Read More button.
- Latest publication date appears first.

SECURITY
- The publishable Supabase key in supabase-config.js is intended for browser use.
- Never put a Supabase secret/service-role key in this website.
- Database and Storage security are enforced through the Row Level Security policies in supabase-setup.sql.
- Only authenticated Supabase users can add, edit or delete content.

QUOTATION FORM
The form continues to submit through Formspree:
https://formspree.io/f/xvzedeea
The public contact email can be changed in Website Admin > Settings.
The actual delivery mailbox is managed in the Formspree dashboard.
