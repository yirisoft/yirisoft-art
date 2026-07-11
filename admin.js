// ============================================================
// Site dashboard — edits content.json with live preview.
// Publish: POSTs to save.php (Hostinger). Fallback: download
// content.json and upload it via hPanel File Manager.
// ============================================================

let data = null;
let activeSection = "theme";
let dragState = null;
const openItems = new Set();

const $ = (s) => document.querySelector(s);
const statusEl = $("#status");

// ---------- Schema: what's editable, section by section ----------
const SCHEMA = {
  theme: {
    label: "🎨 Theme & Colors",
    hint: "These recolor the whole site instantly — accents drive buttons, glows, highlights, and the hero gradient. Backgrounds can also be a photo or a looping video (jpg / png / mp4).",
    fields: [
      { path: "theme.accent", type: "color", label: "Primary accent" },
      { path: "theme.accentBright", type: "color", label: "Primary accent — light variant" },
      { path: "theme.accent2", type: "color", label: "Secondary accent" },
      { path: "theme.bg", type: "color", label: "Page background color" },
      { path: "theme.bgMedia", type: "media", label: "Page background — image or video (optional)" },
      { path: "theme.bgDim", type: "range", label: "Page background dim (higher = more readable)", min: 0, max: 95 },
      { path: "theme.bgAlt", type: "color", label: "Alternate section background" },
      { path: "theme.surface", type: "color", label: "Card background color" },
      { path: "theme.surfaceMedia", type: "media", label: "Card background — image or video (optional)" },
      { path: "theme.surfaceDim", type: "range", label: "Card background dim (higher = more readable)", min: 0, max: 95 },
    ],
  },
  hero: {
    label: "🏠 Hero",
    fields: [
      { path: "hero.eyebrow", type: "text", label: "Eyebrow (small text above title)" },
      { path: "hero.title", type: "textarea", label: "Big title (line breaks are kept)", rows: 2 },
      { path: "hero.tagline", type: "text", label: "Tagline" },
      { path: "hero.taglineEm", type: "text", label: "Tagline highlight (italic, colored)" },
      { path: "hero.sub", type: "textarea", label: "Intro paragraph", rows: 4 },
      { path: "hero.cta1", type: "text", label: "Button 1 label" },
      { path: "hero.cta2", type: "text", label: "Button 2 label" },
    ],
  },
  about: {
    label: "👤 About",
    fields: [
      { path: "about.heading", type: "textarea", label: "Heading (line breaks are kept)", rows: 2 },
      { path: "about.paragraphs", type: "paragraphs", label: "Paragraphs — separate each with a blank line", rows: 14 },
      { path: "about.skillsTitle", type: "text", label: "Skills card title" },
      {
        path: "about.skills", type: "list", label: "Skills — drag ☰ to reorder",
        itemLabel: (it) => `${it.icon || ""} ${it.title || "Skill"}`,
        fields: [
          { path: "icon", type: "text", label: "Emoji icon" },
          { path: "title", type: "text", label: "Title" },
          { path: "desc", type: "text", label: "Description" },
        ],
        blank: { icon: "✨", title: "New skill", desc: "" },
      },
    ],
  },
  work: {
    label: "🗂️ Case Studies",
    fields: [
      { path: "work.heading", type: "text", label: "Heading" },
      { path: "work.intro", type: "textarea", label: "Intro paragraph", rows: 4 },
      {
        path: "work.cases", type: "list", label: "Case studies — drag ☰ to reorder",
        itemLabel: (it) => it.title || "Case study",
        fields: [
          { path: "title", type: "text", label: "Project title" },
          { path: "tag", type: "text", label: "Thumbnail tag" },
          { path: "meta", type: "text", label: "Game · Studio · Platform — Year" },
          { path: "challenge", type: "textarea", label: "The challenge", rows: 3 },
          { path: "role", type: "text", label: "Your role" },
          { path: "designed", type: "lines", label: "What you designed — one per line", rows: 4 },
          { path: "linkUrl", type: "text", label: "Full case study URL" },
          { path: "includes", type: "text", label: "“Includes” line" },
          { path: "colors.0", type: "color", label: "Thumbnail gradient — start" },
          { path: "colors.1", type: "color", label: "Thumbnail gradient — middle" },
          { path: "colors.2", type: "color", label: "Thumbnail gradient — end" },
        ],
        blank: {
          tag: "New Project", title: "New Case Study", meta: "Game · Studio · Platform — Year",
          challenge: "", role: "", designed: [], linkUrl: "#",
          includes: "Includes: wireframes · high-fidelity mockups · prototype videos · final in-game screenshots",
          colors: ["#2b1a5e", "#6d3ef0", "#22d3ee"],
        },
      },
    ],
  },
  resume: {
    label: "📄 Resume",
    hint: "To swap the PDF itself, upload the new file into the assets folder (hPanel File Manager) and update the path below.",
    fields: [
      { path: "resume.heading", type: "textarea", label: "Heading (line breaks are kept)", rows: 2 },
      { path: "resume.summary", type: "textarea", label: "Summary paragraph", rows: 4 },
      { path: "resume.buttonLabel", type: "text", label: "Download button label" },
      { path: "resume.pdf", type: "text", label: "PDF file path" },
      { path: "resume.pdfNote", type: "text", label: "Note under the button" },
      {
        path: "resume.experience", type: "list", label: "Experience — drag ☰ to reorder",
        itemLabel: (it) => `${it.title || "Role"} · ${it.company || ""}`,
        fields: [
          { path: "title", type: "text", label: "Job title" },
          { path: "company", type: "text", label: "Company" },
          { path: "companyNote", type: "text", label: "Company note (optional, shown faint)" },
          { path: "date", type: "text", label: "Dates / location" },
          { path: "current", type: "checkbox", label: "Current role (glowing marker)" },
          { path: "bullets", type: "lines", label: "Bullets — one per line", rows: 5 },
          {
            path: "projects", type: "list", label: "Projects — each opens its own page",
            itemLabel: (it) => it.title || "Project",
            fields: [
              { path: "title", type: "text", label: "Project name (the page link comes from this)" },
              { path: "role", type: "text", label: "Your role on this project" },
              { path: "duration", type: "text", label: "Duration (e.g. Jan — Jun 2024)" },
              { path: "platforms", type: "text", label: "Platforms (e.g. PC · iOS)" },
              { path: "tools", type: "text", label: "Tools used" },
              { path: "linkUrl", type: "text", label: "External link URL (store page etc — optional)" },
              { path: "linkLabel", type: "text", label: "External link label" },
              { path: "cover", type: "media", label: "Cover photo — shown on the timeline chip" },
              { path: "header", type: "media", label: "Header photo / video — big banner on the project page" },
              { path: "about", type: "textarea", label: "About the game", rows: 5 },
              {
                path: "blocks", type: "list", label: "Case study blocks — blog-style sections",
                itemLabel: (b) => b.heading || "Section",
                fields: [
                  { path: "heading", type: "text", label: "Heading" },
                  { path: "body", type: "textarea", label: "Text — separate paragraphs with a blank line", rows: 6 },
                  { path: "media", type: "media", label: "Image or video (optional)" },
                  { path: "caption", type: "text", label: "Media caption (optional)" },
                ],
                blank: { heading: "New section", body: "", media: "", caption: "" },
              },
              {
                path: "gallery", type: "list", label: "Gallery (png / jpg / mp4)",
                itemLabel: (g) => g.caption || (g.src ? g.src.split("/").pop() : "New media"),
                fields: [
                  { path: "src", type: "media", label: "Image or video" },
                  { path: "caption", type: "text", label: "Caption (optional)" },
                ],
                blank: { src: "", caption: "" },
              },
              {
                path: "contributors", type: "list", label: "Other contributors",
                itemLabel: (c) => c.name || "Contributor",
                fields: [
                  { path: "name", type: "text", label: "Name" },
                  { path: "role", type: "text", label: "Their role" },
                  { path: "link", type: "text", label: "Link — portfolio / LinkedIn (optional)" },
                ],
                blank: { name: "", role: "", link: "" },
              },
              { path: "usePalette", type: "checkbox", label: "Use a custom color palette on this project's page" },
              { path: "palette.accent", type: "color", label: "Palette — primary accent" },
              { path: "palette.accentBright", type: "color", label: "Palette — accent light variant" },
              { path: "palette.accent2", type: "color", label: "Palette — secondary accent" },
              { path: "palette.bg", type: "color", label: "Palette — page background" },
              { path: "palette.surface", type: "color", label: "Palette — card background" },
              { path: "bgMedia", type: "media", label: "Custom page background — image or video (optional)" },
              { path: "bgDim", type: "range", label: "Custom background dim", min: 0, max: 95 },
            ],
            blank: {
              title: "New Project", role: "", duration: "", platforms: "", tools: "",
              linkUrl: "", linkLabel: "", cover: "", header: "", about: "",
              blocks: [], gallery: [], contributors: [],
              usePalette: false,
              palette: { accent: "#8b5cf6", accentBright: "#a78bfa", accent2: "#22d3ee", bg: "#0b0b12", surface: "#161624" },
              bgMedia: "", bgDim: 70,
            },
          },
        ],
        blank: { date: "", title: "New Role", company: "", companyNote: "", current: false, bullets: [], projects: [] },
      },
      {
        path: "resume.skillGroups", type: "list", label: "Skill groups",
        itemLabel: (it) => it.name || "Group",
        fields: [
          { path: "name", type: "text", label: "Group name" },
          { path: "items", type: "textarea", label: "Items (separate with ·)", rows: 2 },
        ],
        blank: { name: "New group", items: "" },
      },
      {
        path: "resume.awards", type: "list", label: "Awards — drag ☰ to reorder",
        itemLabel: (it) => it.title || "Award",
        fields: [
          { path: "title", type: "text", label: "Award title (emoji welcome)" },
          { path: "desc", type: "textarea", label: "Description (optional)", rows: 2 },
        ],
        blank: { title: "🏆 New award", desc: "" },
      },
      {
        path: "resume.education", type: "list", label: "Education & certifications",
        itemLabel: (it) => it.name || "Entry",
        fields: [
          { path: "name", type: "text", label: "Name" },
          { path: "desc", type: "text", label: "School / provider · years" },
        ],
        blank: { name: "New entry", desc: "" },
      },
    ],
  },
  contact: {
    label: "📬 Contact",
    fields: [
      { path: "contact.heading", type: "textarea", label: "Heading (line breaks are kept)", rows: 2 },
      { path: "contact.intro", type: "textarea", label: "Intro paragraph", rows: 4 },
      { path: "contact.availabilityBefore", type: "text", label: "Availability — lead-in" },
      { path: "contact.availabilityHighlight", type: "text", label: "Availability — highlighted part" },
      { path: "contact.availabilityAfter", type: "text", label: "Availability — ending" },
      { path: "contact.email", type: "text", label: "Email address" },
      { path: "contact.linkedin", type: "text", label: "LinkedIn URL" },
      { path: "contact.linkedinLabel", type: "text", label: "LinkedIn card label" },
      { path: "contact.availableFor", type: "text", label: "“Available for” card" },
      { path: "contact.ctaLabel", type: "text", label: "Big button label" },
      { path: "contact.footnote", type: "text", label: "Footnote" },
    ],
  },
  footer: {
    label: "🔻 Footer",
    fields: [
      { path: "footer.copyright", type: "text", label: "Copyright line" },
      { path: "footer.tagline", type: "text", label: "Tagline" },
    ],
  },
};

// ---------- Path helpers ----------
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
}

// ---------- Status ----------
function setStatus(msg, cls) {
  statusEl.textContent = msg;
  statusEl.className = "status" + (cls ? " " + cls : "");
}

// ---------- Preview ----------
let previewTimer = null;
function schedulePreview() {
  setStatus("Unsaved changes — Publish or Download when ready");
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    localStorage.setItem("mmd-draft", JSON.stringify(data));
    const frame = $("#previewFrame");
    try { frame.contentWindow.location.reload(); } catch (e) { frame.src = "index.html?preview=1"; }
  }, 400);
}

// ---------- Form rendering ----------
function fieldControl(f, basePath) {
  const path = basePath ? `${basePath}.${f.path}` : f.path;
  const val = getPath(data, path);
  const wrap = document.createElement("div");
  wrap.className = "field";

  if (f.type !== "checkbox") {
    const label = document.createElement("label");
    label.textContent = f.label;
    wrap.appendChild(label);
  }

  const commit = (v) => { setPath(data, path, v); schedulePreview(); };

  if (f.type === "text") {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = val ?? "";
    inp.addEventListener("input", () => commit(inp.value));
    wrap.appendChild(inp);
  } else if (f.type === "textarea") {
    const ta = document.createElement("textarea");
    ta.rows = f.rows || 3;
    ta.value = val ?? "";
    ta.addEventListener("input", () => commit(ta.value));
    wrap.appendChild(ta);
  } else if (f.type === "lines") {
    const ta = document.createElement("textarea");
    ta.rows = f.rows || 4;
    ta.value = Array.isArray(val) ? val.join("\n") : "";
    ta.addEventListener("input", () => commit(ta.value.split("\n").map((s) => s.trim()).filter(Boolean)));
    wrap.appendChild(ta);
  } else if (f.type === "paragraphs") {
    const ta = document.createElement("textarea");
    ta.rows = f.rows || 10;
    ta.value = Array.isArray(val) ? val.join("\n\n") : "";
    ta.addEventListener("input", () => commit(ta.value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)));
    wrap.appendChild(ta);
  } else if (f.type === "color") {
    const row = document.createElement("div");
    row.className = "color-field";
    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = val || "#8b5cf6";
    const hex = document.createElement("input");
    hex.type = "text";
    hex.value = val || "";
    picker.addEventListener("input", () => { hex.value = picker.value; commit(picker.value); });
    hex.addEventListener("input", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) { picker.value = hex.value; commit(hex.value); }
    });
    row.appendChild(picker);
    row.appendChild(hex);
    wrap.appendChild(row);
  } else if (f.type === "range") {
    const row = document.createElement("div");
    row.className = "range-field";
    const inp = document.createElement("input");
    inp.type = "range";
    inp.min = f.min ?? 0;
    inp.max = f.max ?? 100;
    inp.value = val ?? 70;
    const out = document.createElement("span");
    out.className = "range-value";
    out.textContent = inp.value + "%";
    inp.addEventListener("input", () => {
      out.textContent = inp.value + "%";
      commit(Number(inp.value));
    });
    row.appendChild(inp);
    row.appendChild(out);
    wrap.appendChild(row);
  } else if (f.type === "media") {
    const pathRow = document.createElement("div");
    pathRow.className = "media-path-row";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.placeholder = "No media — using the solid color";
    inp.value = val ?? "";
    inp.addEventListener("input", () => commit(inp.value.trim()));
    const clear = document.createElement("button");
    clear.className = "media-clear";
    clear.textContent = "✕";
    clear.title = "Remove media, use the solid color";
    clear.addEventListener("click", () => { inp.value = ""; commit(""); });
    pathRow.appendChild(inp);
    pathRow.appendChild(clear);

    const zone = document.createElement("div");
    zone.className = "drop-zone";
    zone.textContent = "Drop a jpg / png / mp4 here — or click to browse";
    const file = document.createElement("input");
    file.type = "file";
    file.accept = ".jpg,.jpeg,.png,.mp4";
    file.style.display = "none";

    const handleFile = (fileObj) => {
      if (!fileObj) return;
      if (!/\.(jpe?g|png|mp4)$/i.test(fileObj.name)) {
        setStatus("Only jpg, png, or mp4 files are supported", "err");
        return;
      }
      uploadMedia(fileObj, (path) => { inp.value = path; commit(path); });
    };

    zone.addEventListener("click", () => file.click());
    file.addEventListener("change", () => handleFile(file.files[0]));
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("over"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("over");
      handleFile(e.dataTransfer.files[0]);
    });

    wrap.appendChild(pathRow);
    wrap.appendChild(zone);
    wrap.appendChild(file);
  } else if (f.type === "checkbox") {
    const row = document.createElement("div");
    row.className = "checkbox-field";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!val;
    cb.id = "cb-" + path.replace(/\./g, "-");
    const label = document.createElement("label");
    label.textContent = f.label;
    label.htmlFor = cb.id;
    cb.addEventListener("change", () => commit(cb.checked));
    row.appendChild(cb);
    row.appendChild(label);
    wrap.appendChild(row);
  }
  return wrap;
}

function listControl(f) {
  const wrap = document.createElement("div");
  wrap.className = "list-wrap";
  const label = document.createElement("label");
  label.textContent = f.label;
  label.style.cssText = "display:block;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--faint);margin-bottom:8px;";
  wrap.appendChild(label);

  const arr = getPath(data, f.path) || [];

  arr.forEach((item, i) => {
    const key = `${f.path}:${i}`;
    const card = document.createElement("div");
    card.className = "list-item" + (openItems.has(key) ? " open" : "");
    card.dataset.index = i;

    // Header: drag handle · title · delete · chevron
    const head = document.createElement("div");
    head.className = "list-item-head";

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "☰";
    handle.draggable = true;
    handle.addEventListener("dragstart", (e) => {
      dragState = { listPath: f.path, from: i };
      e.dataTransfer.effectAllowed = "move";
    });

    const title = document.createElement("span");
    title.className = "list-item-title";
    title.textContent = f.itemLabel(item);

    const del = document.createElement("button");
    del.className = "list-item-del";
    del.textContent = "✕";
    del.title = "Delete";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(`Delete “${f.itemLabel(item)}”?`)) return;
      arr.splice(i, 1);
      openItems.delete(key);
      renderForm();
      schedulePreview();
    });

    const chev = document.createElement("span");
    chev.className = "list-item-chevron";
    chev.textContent = "▶";

    head.appendChild(handle);
    head.appendChild(title);
    head.appendChild(del);
    head.appendChild(chev);
    head.addEventListener("click", () => {
      card.classList.toggle("open");
      card.classList.contains("open") ? openItems.add(key) : openItems.delete(key);
    });

    // Drop target behavior
    card.addEventListener("dragover", (e) => {
      if (dragState && dragState.listPath === f.path) {
        e.preventDefault();
        card.classList.add("drag-over");
      }
    });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      if (!dragState || dragState.listPath !== f.path) return;
      const from = dragState.from;
      const to = i;
      dragState = null;
      if (from === to) return;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      renderForm();
      schedulePreview();
    });

    // Body: nested fields (relative paths); lists nest recursively
    const body = document.createElement("div");
    body.className = "list-item-body";
    f.fields.forEach((sub) => {
      if (sub.type === "list") {
        body.appendChild(listControl({ ...sub, path: `${f.path}.${i}.${sub.path}` }));
        return;
      }
      const ctl = fieldControl(sub, `${f.path}.${i}`);
      // keep the card title in sync while typing
      ctl.addEventListener("input", () => { title.textContent = f.itemLabel(arr[i]); });
      body.appendChild(ctl);
    });

    card.appendChild(head);
    card.appendChild(body);
    wrap.appendChild(card);
  });

  const add = document.createElement("button");
  add.className = "add-btn";
  add.textContent = "＋ Add";
  add.addEventListener("click", () => {
    arr.push(JSON.parse(JSON.stringify(f.blank)));
    setPath(data, f.path, arr);
    openItems.add(`${f.path}:${arr.length - 1}`);
    renderForm();
    schedulePreview();
  });
  wrap.appendChild(add);

  return wrap;
}

function renderForm() {
  const form = $("#form");
  form.innerHTML = "";
  const section = SCHEMA[activeSection];

  const h = document.createElement("h2");
  h.className = "section-heading";
  h.textContent = section.label;
  form.appendChild(h);

  if (section.hint) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.style.marginTop = "0";
    hint.textContent = section.hint;
    form.appendChild(hint);
  }

  section.fields.forEach((f) => {
    form.appendChild(f.type === "list" ? listControl(f) : fieldControl(f));
  });
}

function renderSidebar() {
  const nav = $("#sidebar");
  nav.innerHTML = "";
  Object.entries(SCHEMA).forEach(([key, sec]) => {
    const btn = document.createElement("button");
    btn.className = "side-btn" + (key === activeSection ? " active" : "");
    btn.textContent = sec.label;
    btn.addEventListener("click", () => {
      activeSection = key;
      renderSidebar();
      renderForm();
    });
    nav.appendChild(btn);
  });
}

// ---------- Load / save ----------
async function loadContent() {
  try {
    const res = await fetch("content.json?ts=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    data = await res.json();
    localStorage.setItem("mmd-draft", JSON.stringify(data));
    renderSidebar();
    renderForm();
    $("#previewFrame").src = "index.html?preview=1";
    setStatus("Loaded — all changes preview live on the right");
  } catch (e) {
    setStatus("Couldn't load content.json — open this page through a web server, not by double-clicking the file", "err");
  }
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "content.json";
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus("Downloaded — upload content.json to public_html via hPanel File Manager", "ok");
}

async function publish() {
  const password = $("#password").value;
  if (!password) {
    setStatus("Enter the publish password first (top right)", "err");
    $("#password").focus();
    return;
  }
  setStatus("Publishing…");
  try {
    const res = await fetch("save.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, content: data }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      setStatus("Published! The live site is updated ✔", "ok");
    } else {
      setStatus(out.error || `Publish failed (HTTP ${res.status})`, "err");
    }
  } catch (e) {
    setStatus("No save.php on this server — use ⬇ Download JSON and upload it manually", "err");
  }
}

async function uploadMedia(file, onDone) {
  const password = $("#password").value;
  if (!password) {
    setStatus("Enter the publish password (top right) to upload files", "err");
    $("#password").focus();
    return;
  }
  setStatus(`Uploading ${file.name}…`);
  try {
    const fd = new FormData();
    fd.append("password", password);
    fd.append("file", file);
    const res = await fetch("save.php", { method: "POST", body: fd });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok && out.path) {
      onDone(out.path);
      setStatus(`Uploaded ${file.name} ✔ — remember to Publish`, "ok");
    } else {
      setStatus(out.error || `Upload failed (HTTP ${res.status})`, "err");
    }
  } catch (e) {
    setStatus("No save.php on this server — copy the file into the assets folder yourself and type its path (e.g. assets/my-bg.mp4)", "err");
  }
}

// ---------- Wire up ----------
$("#btnReload").addEventListener("click", () => {
  if (confirm("Discard unsaved changes and reload the saved content?")) loadContent();
});
$("#btnDownload").addEventListener("click", downloadJSON);
$("#btnPublish").addEventListener("click", publish);
$("#pvDesktop").addEventListener("click", () => {
  $("#previewFrame").classList.remove("mobile");
  $("#pvDesktop").classList.add("active");
  $("#pvMobile").classList.remove("active");
});
$("#pvMobile").addEventListener("click", () => {
  $("#previewFrame").classList.add("mobile");
  $("#pvMobile").classList.add("active");
  $("#pvDesktop").classList.remove("active");
});

loadContent();
