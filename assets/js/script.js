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

function buildProjectCard(p, index) {
    const li = document.createElement("li");
    li.className = "project-item";
    li.dataset.status = p.status || "archive";

    const gradients = (typeof PROJECT_GRADIENTS !== "undefined") ? PROJECT_GRADIENTS : ["linear-gradient(135deg,#0d1117,#161b22)"];
    const grad = gradients[p.gradientId != null ? p.gradientId % gradients.length : 0];
    const numStr = index != null ? String(index + 1).padStart(2, "0") : "";
    const primary = (p.categories || [])[0] || "tools";

    // Typographic tile — no fake image dependency
    const tileHtml = `
    <div class="project-tile" style="--tile-bg:${grad}" data-cat="${primary}">
      <div class="project-tile-number">${numStr}</div>
      <h3 class="project-tile-title">${p.title}</h3>
      <p class="project-tile-cat">${p.subtitle || ""}</p>
    </div>`;

    const techHtml = (p.tech || []).slice(0, 4).map(t => `<span class="project-tag">${t}</span>`).join("");

    const cardInner = `${tileHtml}
    <div class="project-info">
      <div class="project-tags">${techHtml}</div>
    </div>`;

    const url = getProjectUrl(p);
    if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.setAttribute("aria-label", "View " + p.title);
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
        archive.forEach((p, i) => list.appendChild(buildProjectCard(p, i)));
    } else {
        list.appendChild(buildSectionLabel("No projects match this filter."));
    }
}

// ─── PROJECT FILTER DROPDOWN ─────────────────────────────────────────────────
const projectFilterEl = document.getElementById("project-filter");
if (projectFilterEl) {
    projectFilterEl.addEventListener("change", function () { renderProjects(this.value); });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    renderProjects("all");
});