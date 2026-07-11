# How to Edit Your Site

All the site's content lives in one file: **content.json**. The dashboard (**admin.html**) edits it for you — you never need to touch code.

## Editing locally (on this PC)

1. Start the local server (the `.claude/launch.json` "portfolio" config, or run `python -m http.server 4173` in this folder)
2. Open http://localhost:4173/admin.html
3. Edit anything — every change previews live on the right
4. Click **⬇ Download JSON**, then upload the downloaded `content.json` to `public_html` in Hostinger's File Manager (overwrite the old one). Done — the live site updates instantly.

## Editing live on Hostinger (from anywhere)

One-time setup:
1. Open `save.php` and change `CHANGE-ME-before-uploading` to a long, unique password
2. Upload ALL site files to `public_html` (including `admin.html`, `admin.css`, `admin.js`, `save.php`, `content.json`)

Then, any time:
1. Go to `https://yourdomain.com/admin.html`
2. Edit, type your password (top right), click **🚀 Publish** — the live site updates immediately
3. `save.php` keeps one automatic backup (`content.backup.json`) of the previous version

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
