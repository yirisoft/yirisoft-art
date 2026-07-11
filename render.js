// Hydrates the page from content.json — the single source of truth edited via admin.html.
// The static HTML acts as a fallback if the fetch fails (e.g. opening index.html directly from disk).
(async function () {
  const isPreview = new URLSearchParams(location.search).has("preview");

  let data = null;
  if (isPreview) {
    try { data = JSON.parse(localStorage.getItem("mmd-draft")); } catch (e) { /* fall through */ }
  }
  if (!data) {
    try {
      const res = await fetch("content.json?ts=" + Date.now());
      data = await res.json();
    } catch (e) {
      return; // keep static fallback content
    }
  }

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const br = (s) => esc(s).replace(/\n/g, "<br>");
  const setText = (sel, v) => { const el = document.querySelector(sel); if (el && v != null) el.textContent = v; };
  const setHTML = (sel, v) => { const el = document.querySelector(sel); if (el && v != null) el.innerHTML = v; };

  // ---- Theme ----
  const t = data.theme || {};
  const root = document.documentElement.style;
  const themeVars = {
    "--accent": t.accent, "--accent-bright": t.accentBright, "--accent-2": t.accent2,
    "--bg": t.bg, "--bg-alt": t.bgAlt, "--surface": t.surface
  };
  for (const [k, v] of Object.entries(themeVars)) if (v) root.setProperty(k, v);

  // ---- Hero ----
  const h = data.hero || {};
  setText(".hero-eyebrow", h.eyebrow);
  setHTML(".hero-title", br(h.title));
  setHTML(".hero-tagline", `${esc(h.tagline)} <em>${esc(h.taglineEm)}</em>`);
  setText(".hero-sub", h.sub);
  const ctas = document.querySelectorAll(".hero-cta .btn");
  if (ctas[0] && h.cta1) ctas[0].textContent = h.cta1;
  if (ctas[1] && h.cta2) ctas[1].textContent = h.cta2;

  // ---- About ----
  const a = data.about || {};
  setHTML("#about .section-title", br(a.heading));
  if (Array.isArray(a.paragraphs)) {
    setHTML(".about-text", a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join(""));
  }
  setText(".about-skills h3", a.skillsTitle);
  if (Array.isArray(a.skills)) {
    setHTML(".skill-list", a.skills.map((s) => `
      <li>
        <span class="skill-icon">${esc(s.icon)}</span>
        <div><strong>${esc(s.title)}</strong>${esc(s.desc)}</div>
      </li>`).join(""));
  }

  // ---- Work ----
  const w = data.work || {};
  setText("#work .section-title", w.heading);
  setText("#work .section-intro", w.intro);
  if (Array.isArray(w.cases)) {
    setHTML(".case-grid", w.cases.map((c) => {
      const cols = Array.isArray(c.colors) && c.colors.length >= 3 ? c.colors : ["#2b1a5e", "#6d3ef0", "#22d3ee"];
      const grad = `linear-gradient(140deg, ${cols[0]} 0%, ${cols[1]} 55%, ${cols[2]} 130%)`;
      return `
      <article class="case-card reveal">
        <div class="case-thumb" style="background:${grad}">
          <span class="case-thumb-tag">${esc(c.tag)}</span>
        </div>
        <div class="case-body">
          <h3>${esc(c.title)}</h3>
          <p class="case-meta">${esc(c.meta)}</p>
          <div class="case-block"><h4>The Challenge</h4><p>${esc(c.challenge)}</p></div>
          <div class="case-block"><h4>My Role</h4><p>${esc(c.role)}</p></div>
          <div class="case-block"><h4>What I Designed</h4>
            <ul>${(c.designed || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          </div>
          <a href="${esc(c.linkUrl || "#")}" class="case-link">→ View Full Case Study</a>
          <p class="case-includes">${esc(c.includes)}</p>
        </div>
      </article>`;
    }).join(""));
  }

  // ---- Resume ----
  const r = data.resume || {};
  setHTML("#resume .section-title", br(r.heading));
  setText("#resume .section-intro", r.summary);
  const dl = document.querySelector("#resume a[download]");
  if (dl) {
    if (r.buttonLabel) dl.textContent = r.buttonLabel;
    if (r.pdf) {
      dl.setAttribute("href", r.pdf);
      dl.setAttribute("download", r.pdf.split("/").pop());
    }
  }
  setText(".resume-download-note", r.pdfNote);
  const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (Array.isArray(r.experience)) {
    setHTML(".timeline", r.experience.map((x) => `
      <article class="timeline-item reveal">
        <div class="timeline-marker${x.current ? " current" : ""}"></div>
        <div class="timeline-content">
          <span class="timeline-date">${esc(x.date)}</span>
          <h4>${esc(x.title)}</h4>
          <p class="timeline-company">${esc(x.company)}${x.companyNote ? ` <span>${esc(x.companyNote)}</span>` : ""}</p>
          <ul>${(x.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
          ${(x.projects || []).length ? `
          <div class="timeline-projects-label">Projects</div>
          <div class="timeline-projects">
            ${x.projects.map((p) => `
              <a class="project-chip" href="project.html?id=${encodeURIComponent(slugify(p.title))}${isPreview ? "&preview=1" : ""}">
                <span class="project-chip-thumb" style="${p.cover ? `background-image:url('${esc(p.cover)}')` : "background:linear-gradient(135deg, var(--accent), var(--accent-2))"}"></span>
                <span class="project-chip-info">
                  <strong>${esc(p.title)}</strong>
                  <span>${esc(p.duration || p.role || "View project")} →</span>
                </span>
              </a>`).join("")}
          </div>` : ""}
        </div>
      </article>`).join(""));
  }
  const sideCards = [];
  if (Array.isArray(r.skillGroups)) {
    sideCards.push(`
      <div class="resume-card reveal">
        <h3 class="resume-col-title">Skills &amp; Tools</h3>
        ${r.skillGroups.map((g) => `<div class="resume-skill-group"><h5>${esc(g.name)}</h5><p>${esc(g.items)}</p></div>`).join("")}
      </div>`);
  }
  if (Array.isArray(r.awards)) {
    sideCards.push(`
      <div class="resume-card reveal">
        <h3 class="resume-col-title">Awards</h3>
        <ul class="resume-award-list">
          ${r.awards.map((aw) => `<li><strong>${esc(aw.title)}</strong>${aw.desc ? esc(aw.desc) : ""}</li>`).join("")}
        </ul>
      </div>`);
  }
  if (Array.isArray(r.education)) {
    sideCards.push(`
      <div class="resume-card reveal">
        <h3 class="resume-col-title">Education</h3>
        ${r.education.map((e2) => `<div class="resume-skill-group"><h5>${esc(e2.name)}</h5><p>${esc(e2.desc)}</p></div>`).join("")}
      </div>`);
  }
  if (sideCards.length) setHTML(".resume-side", sideCards.join(""));

  // ---- Contact ----
  const c = data.contact || {};
  setHTML("#contact .section-title", br(c.heading));
  setText("#contact .section-intro", c.intro);
  setHTML(".contact-availability",
    `${esc(c.availabilityBefore)} <strong>${esc(c.availabilityHighlight)}</strong> ${esc(c.availabilityAfter)}`);
  setHTML(".contact-cards", `
    <a href="mailto:${esc(c.email)}" class="contact-card">
      <span class="contact-card-icon">📧</span>
      <span class="contact-card-label">Email</span>
      <span class="contact-card-value">${esc(c.email)}</span>
    </a>
    <a href="${esc(c.linkedin)}" target="_blank" rel="noopener" class="contact-card">
      <span class="contact-card-icon">🔗</span>
      <span class="contact-card-label">LinkedIn</span>
      <span class="contact-card-value">${esc(c.linkedinLabel)}</span>
    </a>
    <div class="contact-card">
      <span class="contact-card-icon">💼</span>
      <span class="contact-card-label">Available for</span>
      <span class="contact-card-value">${esc(c.availableFor)}</span>
    </div>`);
  const cta = document.querySelector(".contact-cta .btn");
  if (cta) { cta.textContent = c.ctaLabel || cta.textContent; cta.setAttribute("href", `mailto:${c.email}`); }
  setText(".contact-footnote", c.footnote);

  // ---- Footer ----
  const f = data.footer || {};
  const footP = document.querySelectorAll(".footer-inner p");
  if (footP[0] && f.copyright) footP[0].textContent = f.copyright;
  if (footP[1] && f.tagline) footP[1].textContent = f.tagline;

  // ---- Background & card media (jpg / png / mp4) ----
  const mediaEl = (src) => {
    if (/\.mp4(\?|$)/i.test(src)) {
      const v = document.createElement("video");
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "auto";
      v.src = src;
      return v;
    }
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    return img;
  };

  if (t.bgMedia) {
    document.body.classList.add("has-bg-media");
    const holder = document.createElement("div");
    holder.id = "bg-media";
    holder.appendChild(mediaEl(t.bgMedia));
    const ov = document.createElement("div");
    ov.className = "bg-media-overlay";
    ov.style.opacity = String((t.bgDim ?? 70) / 100);
    holder.appendChild(ov);
    document.body.prepend(holder);
  }

  if (t.surfaceMedia) {
    document.querySelectorAll(".about-skills, .case-body, .resume-card, .contact-card").forEach((card) => {
      card.classList.add("has-card-media");
      const layer = document.createElement("div");
      layer.className = "card-media-layer";
      layer.appendChild(mediaEl(t.surfaceMedia));
      const ov = document.createElement("div");
      ov.className = "card-media-overlay";
      ov.style.opacity = String((t.surfaceDim ?? 88) / 100);
      card.prepend(ov);
      card.prepend(layer);
    });
  }

  // Re-attach reveal animations to rebuilt nodes
  if (window.initReveal) window.initReveal();
})();
