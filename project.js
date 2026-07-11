// Renders a single project page from content.json.
// URL: project.html?id=<slug-of-project-title>  (+ &preview=1 for dashboard drafts)
(async function () {
  const params = new URLSearchParams(location.search);
  const isPreview = params.has("preview");
  const id = params.get("id") || "";

  let data = null;
  if (isPreview) {
    try { data = JSON.parse(localStorage.getItem("mmd-draft")); } catch (e) { /* fall through */ }
  }
  if (!data) {
    try {
      const res = await fetch("content.json?ts=" + Date.now());
      data = await res.json();
    } catch (e) {
      document.getElementById("projectRoot").innerHTML =
        '<div class="container project-loading">Couldn’t load content. Open this page through the website, not from disk.</div>';
      return;
    }
  }

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const paras = (s) => String(s || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const isVideo = (src) => /\.mp4(\?|$)/i.test(src);

  const mediaTag = (src, opts = {}) => {
    if (isVideo(src)) {
      return `<video src="${esc(src)}" ${opts.controls ? "controls" : ""} ${opts.autoplay ? "autoplay muted loop playsinline" : 'preload="metadata" muted'}></video>`;
    }
    return `<img src="${esc(src)}" alt="${esc(opts.alt || "")}">`;
  };

  // ---- Find the project and its parent experience ----
  let proj = null, exp = null;
  for (const x of (data.resume && data.resume.experience) || []) {
    const hit = (x.projects || []).find((p) => slugify(p.title) === id);
    if (hit) { proj = hit; exp = x; break; }
  }

  const root = document.getElementById("projectRoot");
  if (!proj) {
    root.innerHTML = '<div class="container project-loading">Project not found. <a href="index.html#resume" style="color:var(--accent-bright)">← Back to the portfolio</a></div>';
    return;
  }

  // ---- Theme: site theme, then per-project palette overrides ----
  const t = data.theme || {};
  const rootStyle = document.documentElement.style;
  const applyVars = (vars) => { for (const [k, v] of Object.entries(vars)) if (v) rootStyle.setProperty(k, v); };
  applyVars({
    "--accent": t.accent, "--accent-bright": t.accentBright, "--accent-2": t.accent2,
    "--bg": t.bg, "--bg-alt": t.bgAlt, "--surface": t.surface,
  });
  if (proj.usePalette && proj.palette) {
    const p = proj.palette;
    applyVars({
      "--accent": p.accent, "--accent-bright": p.accentBright, "--accent-2": p.accent2,
      "--bg": p.bg, "--bg-alt": p.bg ? `color-mix(in srgb, ${p.bg} 88%, white)` : null, "--surface": p.surface,
    });
  }

  // ---- Background media: project's own, else the site-wide one ----
  const bgSrc = proj.bgMedia || t.bgMedia;
  const bgDim = proj.bgMedia ? (proj.bgDim ?? 70) : (t.bgDim ?? 70);
  if (bgSrc) {
    document.body.classList.add("has-bg-media");
    const holder = document.createElement("div");
    holder.id = "bg-media";
    holder.innerHTML = mediaTag(bgSrc, { autoplay: true }) + `<div class="bg-media-overlay" style="opacity:${bgDim / 100}"></div>`;
    document.body.prepend(holder);
  }

  // ---- Page metadata + preview-aware nav links ----
  document.title = `${proj.title} — ${(data.hero && data.hero.eyebrow) || "Portfolio"}`;
  if (isPreview) {
    document.querySelectorAll('a[href^="index.html"]').forEach((a) => {
      a.href = a.getAttribute("href").replace("index.html", "index.html?preview=1");
    });
  }

  // ---- Build the page ----
  const meta = [
    ["Company", `${exp.company}${exp.companyNote ? " " + exp.companyNote : ""}`],
    ["Project", proj.title],
    ["Role", proj.role],
    ["Duration", proj.duration],
    ["Platforms", proj.platforms],
    ["Tools", proj.tools],
  ].filter(([, v]) => v);

  const headerSrc = proj.header || proj.cover;

  root.innerHTML = `
    <section class="project-hero">
      ${headerSrc
        ? `<div class="project-hero-media">${mediaTag(headerSrc, { autoplay: true, alt: proj.title })}</div>`
        : `<div class="project-hero-fallback"></div>`}
      <div class="container project-hero-content">
        <p class="project-company">${esc(exp.company)}</p>
        <h1 class="project-title">${esc(proj.title)}</h1>
        <p class="project-subtitle">${esc([proj.role, proj.duration].filter(Boolean).join(" · "))}</p>
      </div>
    </section>

    <div class="container">
      <dl class="project-meta">
        ${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
        ${proj.linkUrl ? `<a class="btn btn-small btn-ghost" href="${esc(proj.linkUrl)}" target="_blank" rel="noopener">${esc(proj.linkLabel || "Visit ↗")}</a>` : ""}
      </dl>

      ${proj.about ? `
      <section class="project-section project-about">
        <h2 class="project-section-title">About the Game</h2>
        ${paras(proj.about)}
      </section>` : ""}

      ${(proj.blocks || []).length ? `
      <section class="project-section">
        <h2 class="project-section-title">Case Study</h2>
        ${proj.blocks.map((b) => `
          <div class="project-block">
            ${b.heading ? `<h3>${esc(b.heading)}</h3>` : ""}
            ${paras(b.body)}
            ${b.media ? `
              <figure class="block-media">${mediaTag(b.media, { controls: isVideo(b.media), alt: b.caption })}</figure>
              ${b.caption ? `<p class="media-caption">${esc(b.caption)}</p>` : ""}` : ""}
          </div>`).join("")}
      </section>` : ""}

      ${(proj.gallery || []).filter((g) => g.src).length ? `
      <section class="project-section">
        <h2 class="project-section-title">Gallery</h2>
        <div class="gallery-grid">
          ${proj.gallery.filter((g) => g.src).map((g, i) => `
            <button class="gallery-item" data-index="${i}" title="${esc(g.caption || "View")}">
              ${mediaTag(g.src, { alt: g.caption })}
              ${isVideo(g.src) ? '<span class="play-badge">▶</span>' : ""}
            </button>`).join("")}
        </div>
      </section>` : ""}

      ${(proj.contributors || []).filter((c) => c.name).length ? `
      <section class="project-section">
        <h2 class="project-section-title">Other Contributors</h2>
        <div class="contrib-grid">
          ${proj.contributors.filter((c) => c.name).map((c) => c.link
            ? `<a class="contrib-card" href="${esc(c.link)}" target="_blank" rel="noopener"><strong>${esc(c.name)}</strong><span>${esc(c.role)}</span></a>`
            : `<div class="contrib-card"><strong>${esc(c.name)}</strong><span>${esc(c.role)}</span></div>`).join("")}
        </div>
      </section>` : ""}

      <div class="project-bottom">
        <a class="btn btn-primary" href="index.html${isPreview ? "?preview=1" : ""}#resume">← Back to portfolio</a>
      </div>
    </div>`;

  // ---- Footer from content ----
  const f = data.footer || {};
  if (f.copyright) document.getElementById("footerCopy").textContent = f.copyright;
  if (f.tagline) document.getElementById("footerTag").textContent = f.tagline;

  // ---- Lightbox ----
  const items = (proj.gallery || []).filter((g) => g.src);
  const lb = document.getElementById("lightbox");
  const lbContent = lb.querySelector(".lb-content");
  const lbCaption = lb.querySelector(".lb-caption");
  let lbIndex = 0;

  function showLb(i) {
    lbIndex = (i + items.length) % items.length;
    const g = items[lbIndex];
    lbContent.innerHTML = mediaTag(g.src, { controls: true, autoplay: false, alt: g.caption });
    const v = lbContent.querySelector("video");
    if (v) { v.muted = false; v.play().catch(() => {}); }
    lbCaption.textContent = g.caption || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    lb.hidden = true;
    lbContent.innerHTML = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".gallery-item").forEach((btn) => {
    btn.addEventListener("click", () => showLb(Number(btn.dataset.index)));
  });
  lb.querySelector(".lb-close").addEventListener("click", closeLb);
  lb.querySelector(".lb-prev").addEventListener("click", () => showLb(lbIndex - 1));
  lb.querySelector(".lb-next").addEventListener("click", () => showLb(lbIndex + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
  });
  if (items.length < 2) {
    lb.querySelector(".lb-prev").style.display = "none";
    lb.querySelector(".lb-next").style.display = "none";
  }
})();
