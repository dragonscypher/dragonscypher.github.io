'use strict';

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn && sidebar) {
    sidebarBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
}

// ─── MODAL / OVERLAY (keep for future testimonials) ──────────────────────────
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

function toggleModal() {
    if (modalContainer) modalContainer.classList.toggle("active");
    if (overlay) overlay.classList.toggle("active");
}
if (modalCloseBtn) modalCloseBtn.addEventListener("click", toggleModal);
if (overlay) overlay.addEventListener("click", toggleModal);

// ─── NAV (anchor scroll — tab-switch removed, active state handled by animations.js) ─────
// data-nav-link elements are now <a href="#section"> anchor links.
// Active class is managed by IntersectionObserver in animations.js.
// Preserve the click handler only to close the mobile sidebar if open.
const navigationLinks = document.querySelectorAll('[data-nav-link]');
navigationLinks.forEach(link => {
    link.addEventListener('click', () => {
        // On mobile, collapse sidebar after nav link click
        if (sidebar && window.innerWidth < 1250) {
            sidebar.classList.remove('active');
        }
    });
});

// ─── PROJECT CARD BUILDER ────────────────────────────────────────────────────
function getProjectUrl(p) {
    if (p.githubUrl) return p.githubUrl;
    if (p.repoName) return "https://github.com/dragonscypher/" + p.repoName;
    if (p.liveUrl) return p.liveUrl;
    return null;
}

function buildProjectCard(p) {
    const li = document.createElement("li");
    li.className = "project-item active";
    li.dataset.status = p.status || "archive";

    const gradients = (typeof PROJECT_GRADIENTS !== "undefined") ? PROJECT_GRADIENTS : ["linear-gradient(135deg,#0d1117,#161b22)"];
    const grad = gradients[p.gradientId != null ? p.gradientId % gradients.length : 0];

    // Image or gradient placeholder
    const imgHtml = p.image
        ? `<img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` +
        `<div class="project-img-placeholder" style="display:none;background:${grad}"><span class="project-initial">${p.title.charAt(0).toUpperCase()}</span></div>`
        : `<div class="project-img-placeholder" style="background:${grad}"><span class="project-initial">${p.title.charAt(0).toUpperCase()}</span></div>`;

    const techHtml = (p.tech || []).slice(0, 5).map(t => `<span class="project-tag">${t}</span>`).join("");
    const descHtml = (p.status === "featured" && p.description)
        ? `<p class="project-desc">${p.description}</p>` : "";
    const badge = p.status === "featured"
        ? `<span class="project-status-badge">Featured</span>` : "";

    const cardInner = `
    <figure class="project-img">
      <div class="project-item-icon-box"><ion-icon name="eye-outline"></ion-icon></div>
      ${imgHtml}
    </figure>
    <div class="project-info">
      <div class="project-title-row">
        <h3 class="project-title">${p.title}</h3>${badge}
      </div>
      <p class="project-category">${p.subtitle || ""}</p>
      ${descHtml}
      <div class="project-tags">${techHtml}</div>
    </div>`;

    const url = getProjectUrl(p);
    if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.setAttribute("aria-label", "View " + p.title + " project");
        a.innerHTML = cardInner;
        li.appendChild(a);
    } else {
        li.innerHTML = cardInner;
    }
    return li;
}

function buildSectionLabel(text, cls) {
    const li = document.createElement("li");
    li.className = "project-section-label" + (cls ? " " + cls : "");
    li.textContent = text;
    return li;
}

// ─── RENDER PROJECTS ─────────────────────────────────────────────────────────
function renderProjects(filter) {
    if (typeof PROJECTS === "undefined") return;
    const list = document.getElementById("project-list");
    if (!list) return;

    list.innerHTML = "";
    const f = filter || "all";

    const matches = p => {
        if (p.hidden) return false;           // always hide flagged projects
        if (p.status === "featured") return false; // featured go in showcase, not here
        if (f === "all") return true;
        return Array.isArray(p.categories) && p.categories.includes(f);
    };

    const archive = PROJECTS.filter(matches);

    if (archive.length > 0) {
        list.appendChild(buildSectionLabel("Selected Earlier Work", "archive-label"));
        archive.forEach(p => list.appendChild(buildProjectCard(p)));
    } else {
        list.appendChild(buildSectionLabel("No projects match this filter."));
    }
}

// ─── PROJECT FILTER DROPDOWN ─────────────────────────────────────────────────
const projectFilterEl = document.getElementById("project-filter");
if (projectFilterEl) {
    projectFilterEl.addEventListener("change", function () { renderProjects(this.value); });
}

// ─── ARCHIVE TOGGLE ──────────────────────────────────────────────────────────
(function initArchiveToggle() {
    const btn = document.getElementById("archive-toggle");
    const dl = document.getElementById("discovered-list");
    if (!btn || !dl) return;
    btn.addEventListener("click", () => {
        const isOpen = dl.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(isOpen));
        const label = btn.querySelector("span");
        if (label) label.textContent = isOpen ? "Hide older experiments" : "Show older experiments";
    });
})();

// ─── GITHUB ARCHIVE AUTO-DISCOVERY ───────────────────────────────────────────
async function loadGitHubArchive() {
    if (typeof PROJECTS === "undefined") return;
    try {
        const res = await fetch("https://api.github.com/users/dragonscypher/repos?per_page=100&sort=updated");
        if (!res.ok) return;
        const repos = await res.json();
        if (!Array.isArray(repos)) return;

        // Build a set of slugs already curated
        const curated = new Set(PROJECTS.map(p =>
            (p.repoName || p.id || "").toLowerCase().replace(/[-_\s]/g, "")
        ));

        const discovered = repos
            .filter(r => !r.private && !r.fork && !curated.has(r.name.toLowerCase().replace(/[-_\s]/g, "")))
            .slice(0, 8)
            .map((r, i) => ({
                id: r.name.toLowerCase(),
                title: r.name.replace(/[-_]/g, " "),
                subtitle: r.description || "GitHub Repository",
                status: "archive",
                categories: ["archive"],
                tech: r.language ? [r.language] : [],
                githubUrl: r.html_url,
                image: null,
                gradientId: i % 10,
            }));

        if (discovered.length > 0) {
            // Put discovered repos into the collapsed archive toggle list, not the main list
            const dl = document.getElementById("discovered-list");
            if (!dl) return;
            discovered.forEach(p => dl.appendChild(buildProjectCard(p)));
            // Show the toggle button only once we have items
            const btn = document.getElementById("archive-toggle");
            if (btn) btn.style.display = "flex";
        }
    } catch (_) { /* silently fall back to curated data */ }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Hide archive toggle until GitHub discovery fills it
    const archiveBtn = document.getElementById("archive-toggle");
    if (archiveBtn) archiveBtn.style.display = "none";

    renderProjects("all");
    loadGitHubArchive();
});