# How to Edit Your Site

All the site's content lives in one file: **content.json**. The dashboard (**admin.html**) edits it for you — you never need to touch code.

Your site is hosted on **GitHub Pages** (repo `yirisoft/yirisoft-art`, branch `main`), served at your Hostinger domain. The dashboard publishes by committing to that repo through GitHub's API.

## One-time setup: create a GitHub token

1. On GitHub: your avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → *Generate new token*
2. Name it (e.g. "portfolio dashboard"), set an expiry you're comfortable with (you can make a new one when it expires)
3. **Repository access**: *Only select repositories* → choose `yirisoft-art`
4. **Permissions** → Repository permissions → **Contents: Read and write** (nothing else)
5. Generate, and copy the token (starts with `github_pat_…`). Treat it like a password — anyone who has it can edit that repo.

## Editing (from anywhere)

1. Go to `https://yirisoft.art/admin.html` (or run it locally — same thing)
2. Edit anything — every change previews live on the right
3. Paste your GitHub token into the box at the top right
4. Click **🚀 Publish** — the dashboard commits `content.json` to your repo, and GitHub Pages rebuilds the live site in about a minute
5. Media drop zones work the same way: dropping a jpg/png/mp4 commits it to `assets/uploads/` in the repo (it displays once the rebuild finishes)

The token is never stored — you paste it each editing session. **⬇ Download JSON** still works as a fallback if you'd rather commit `content.json` yourself.

## If you ever move to Hostinger PHP hosting instead

`save.php` still ships with the site: set a real password inside it, upload everything to `public_html`, and type that password (instead of a token) in the dashboard — it will save server-side and keep a `content.backup.json` of the previous version.

## What you can edit

- **Theme & Colors** — accents, backgrounds, card colors (recolors the whole site)
  - Page background and card background can also be a **photo (jpg/png) or looping video (mp4)**: drag the file onto the drop zone (uploads via save.php when live on Hostinger), or copy it into `assets/` yourself and type the path. The **dim slider** darkens the media so text stays readable — higher = more readable. Click ✕ to go back to the solid color. Tip: keep background videos short, muted-friendly, and under ~10 MB so the page stays fast.
- **Hero** — name, title, tagline, intro, button labels
- **About** — heading, paragraphs, skills (add / delete / drag ☰ to reorder)
- **Case Studies** — full cards including the thumbnail gradient colors (drag to reorder)
- **Resume** — summary, experience timeline, skill groups, awards, education (drag to reorder)
- **Projects** — inside each experience entry (Resume tab → open an experience → "Projects"). Each project gets its own page at `project.html?id=<project-name>` and shows as a clickable thumbnail chip under that experience on the timeline. Per project you can set:
  - Role, duration, platforms, tools, and an optional external link
  - **Cover photo** (the timeline chip) and **header photo/video** (the big page banner)
  - **About the game** text
  - **Case study blocks** — blog-style sections, each with a heading, paragraphs, and an optional image or video with caption
  - **Gallery** — any mix of png/jpg/mp4, opens in a fullscreen lightbox (arrow keys navigate)
  - **Other contributors** with optional links
  - **Custom palette** (tick "use custom palette") and a **custom page background** — so each project page can match its game's art direction
  - Note: the page link comes from the project name, so renaming a project changes its URL — links on your site update automatically, but links you shared elsewhere won't.
- **Contact** — email, LinkedIn, availability, footnote
- **Footer**

## Swapping the resume PDF

1. Upload the new PDF into the `assets/` folder (File Manager or locally)
2. In the dashboard → Resume → update the "PDF file path" if the filename changed

## Notes

- The dashboard page is safe to have online (it can't save without the password), but if you'd rather keep it hidden, rename `admin.html` to something unguessable like `dashboard-mmd-2026.html`
- If Publish ever fails, **⬇ Download JSON** always works as a fallback
- Keep a copy of this folder somewhere safe — it IS your website
