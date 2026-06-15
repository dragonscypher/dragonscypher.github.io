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
    const nprojectsSection = document.querySelector(".nprojects");
    if (!list) return;

    list.innerHTML = "";
    const f = filter || "all";

    const seen = new Set();
    const matches = p => {
        if (p.hidden) return false;
        if (p.status === "featured") return false;
        // Dedupe by repoName or id
        const key = (p.repoName || p.id || p.title || "").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        if (f === "all") return true;
        return Array.isArray(p.categories) && p.categories.includes(f);
    };

    const archive = PROJECTS.filter(matches);

    if (archive.length > 0) {
        list.appendChild(buildSectionLabel("Selected Earlier Work", "archive-label"));
        archive.forEach((p, i) => list.appendChild(buildProjectCard(p, i)));
        if (nprojectsSection) nprojectsSection.style.display = "";
    } else if (f !== "all") {
        // Only show empty message when a filter is actively applied
        const li = document.createElement("li");
        li.className = "project-section-label";
        li.textContent = "No projects match this filter.";
        list.appendChild(li);
        if (nprojectsSection) nprojectsSection.style.display = "";
    } else {
        // No archive projects at all — hide the whole section
        if (nprojectsSection) nprojectsSection.style.display = "none";
    }
}

// ─── PROJECT FILTER DROPDOWN ─────────────────────────────────────────────────
const projectFilterEl = document.getElementById("project-filter");
if (projectFilterEl) {
    projectFilterEl.addEventListener("change", function () { renderProjects(this.value); });
}

// ─── GITHUB REPO NORMALIZER (for deduplication) ─────────────────────────────
function normalizeKey(s) {
    return (s || "").toLowerCase().replace(/[-_\s]/g, "");
}

// ─── GITHUB AUTO-DISCOVER (collapsed "More on GitHub") ──────────────────────
async function loadGitHubRepos() {
    const section = document.getElementById("github-more-section");
    const list = document.getElementById("github-repos-list");
    const countEl = document.getElementById("github-more-count");
    const btn = document.getElementById("github-more-btn");
    if (!section || !list || !btn) return;

    // Build curated keys set — dedupe against everything already shown
    const curatedKeys = new Set(
        (typeof PROJECTS !== "undefined" ? PROJECTS : [])
            .map(p => normalizeKey(p.repoName || p.id || p.title))
    );

    try {
        const res = await fetch(
            "https://api.github.com/users/dragonscypher/repos?per_page=100&sort=updated&type=public",
            { headers: { "Accept": "application/vnd.github+json" } }
        );
        if (!res.ok) throw new Error("GitHub API " + res.status);
        const repos = await res.json();

        const filtered = repos
            .filter(r => {
                if (r.fork || r.archived) return false;
                if (!r.description || r.description.trim().length < 10) return false;
                // Exclude profile/meta repos
                if (r.name.toLowerCase() === r.owner.login.toLowerCase()) return false;
                if (r.name.toLowerCase().includes(".github.io")) return false;
                if (/^(leetcode|dotfiles|config|readme|profile)/i.test(r.name)) return false;
                if (curatedKeys.has(normalizeKey(r.name))) return false;
                return true;
            })
            .slice(0, 8);

        if (filtered.length === 0) return;

        list.innerHTML = "";
        filtered.forEach(r => {
            const li = document.createElement("li");
            li.className = "github-repo-item";
            const updated = new Date(r.pushed_at).getFullYear();
            li.innerHTML = `<a href="${r.html_url}" target="_blank" rel="noopener noreferrer" class="github-repo-link">
                <span class="github-repo-name">${r.name.replace(/-/g, " ")}</span>
                <span class="github-repo-desc">${r.description}</span>
                <span class="github-repo-meta">${r.language || ""}${r.language ? " · " : ""}${updated}</span>
            </a>`;
            list.appendChild(li);
        });

        if (countEl) countEl.textContent = "(" + filtered.length + ")";
        section.hidden = false;

        // Toggle behavior
        btn.addEventListener("click", () => {
            const open = btn.getAttribute("aria-expanded") === "true";
            btn.setAttribute("aria-expanded", String(!open));
            btn.classList.toggle("open", !open);
            list.hidden = open;
        });

    } catch (err) {
        console.warn("GitHub repos fetch skipped:", err.message);
        // section stays hidden — graceful fallback
    }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    renderProjects("all");
    loadGitHubRepos();
});