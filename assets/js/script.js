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

// ─── THEME TOGGLE ───────────────────────────────────────────────────────────
const THEME_STORAGE_KEY = "portfolio-theme";

function getCurrentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function updateThemeToggle(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    const isLight = theme === "light";
    const icon = btn.querySelector(".theme-toggle-icon");
    const text = btn.querySelector(".theme-toggle-text");

    btn.setAttribute("aria-pressed", String(isLight));
    btn.setAttribute(
        "aria-label",
        "Current theme: " + theme + ". Switch to " + (isLight ? "dark" : "light") + " theme"
    );
    if (icon) icon.textContent = isLight ? "☼" : "☾";
    if (text) text.textContent = isLight ? "Light" : "Dark";
}

function setTheme(theme, persist) {
    const normalized = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = normalized;
    updateThemeToggle(normalized);
    if (persist) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, normalized);
        } catch (error) {
            // Ignore storage failures; the visible theme still updates.
        }
    }
}

function initThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    setTheme(getCurrentTheme(), false);
    btn.addEventListener("click", () => {
        setTheme(getCurrentTheme() === "light" ? "dark" : "light", true);
    });
}

// ─── PROJECT CARD BUILDER ────────────────────────────────────────────────────
function getProjectUrl(p) {
    if (p.githubUrl) return p.githubUrl;
    if (p.repoName) return "https://github.com/dragonscypher/" + p.repoName;
    if (p.liveUrl) return p.liveUrl;
    return null;
}

function normalizeKey(s) {
    return (s || "")
        .toString()
        .toLowerCase()
        .replace(/^https?:\/\/(www\.)?/, "")
        .replace(/^github\.com\/dragonscypher\//, "")
        .replace(/[^a-z0-9]/g, "");
}

function getProjectIdentityKeys(p) {
    return [p.repoName, p.id, p.title, getProjectUrl(p)]
        .map(normalizeKey)
        .filter(Boolean);
}

function isDuplicateProject(p, seen) {
    const keys = getProjectIdentityKeys(p);
    if (keys.some(key => seen.has(key))) return true;
    keys.forEach(key => seen.add(key));
    return false;
}

function buildCuratedProjectKeys() {
    const keys = new Set();
    (typeof PROJECTS !== "undefined" ? PROJECTS : []).forEach(project => {
        getProjectIdentityKeys(project).forEach(key => keys.add(key));
    });
    return keys;
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
        if (f === "all") {
            if (p.hidden || p.status === "featured") return false;
            return !isDuplicateProject(p, seen);
        }
        if (!Array.isArray(p.categories) || !p.categories.includes(f)) return false;
        return !isDuplicateProject(p, seen);
    };

    const projects = PROJECTS.filter(matches);

    if (projects.length > 0) {
        list.appendChild(buildSectionLabel(f === "all" ? "Selected Earlier Work" : "Matching Projects", "archive-label"));
        projects.forEach((p, i) => list.appendChild(buildProjectCard(p, i)));
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

// ─── PROJECT REEL ───────────────────────────────────────────────────────────
function getFeaturedProjects() {
    if (typeof PROJECTS === "undefined") return [];

    const seen = new Set();
    return PROJECTS.filter(project => {
        if (project.hidden || project.status !== "featured") return false;
        return !isDuplicateProject(project, seen);
    });
}

function buildProjectReelItem(project, index) {
    const li = document.createElement("li");
    li.className = "project-reel-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "project-reel-button";
    btn.dataset.index = String(index);
    btn.setAttribute("aria-controls", "project-reel-cover");

    const number = document.createElement("span");
    number.className = "project-reel-item-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const label = document.createElement("span");
    label.className = "project-reel-item-label";

    const title = document.createElement("span");
    title.className = "project-reel-item-title";
    title.textContent = project.title;

    const subtitle = document.createElement("span");
    subtitle.className = "project-reel-item-subtitle";
    subtitle.textContent = project.subtitle || "";

    label.append(title, subtitle);
    btn.append(number, label);
    li.appendChild(btn);
    return li;
}

function updateProjectReel(projects, index) {
    const project = projects[index];
    if (!project) return;

    const image = document.getElementById("project-reel-image");
    const motif = document.getElementById("project-reel-motif");
    const cover = document.getElementById("project-reel-cover");
    const indexEl = document.getElementById("project-reel-index");
    const nameEl = document.getElementById("project-reel-name");
    const subtitleEl = document.getElementById("project-reel-subtitle");
    const summaryEl = document.getElementById("project-reel-summary");
    const techEl = document.getElementById("project-reel-tech");
    const linkEl = document.getElementById("project-reel-link");

    document.querySelectorAll(".project-reel-button").forEach((btn, buttonIndex) => {
        const active = buttonIndex === index;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
    });

    const gradients = (typeof PROJECT_GRADIENTS !== "undefined") ? PROJECT_GRADIENTS : [];
    const gradient = gradients[project.gradientId != null ? project.gradientId % gradients.length : 0]
        || "linear-gradient(135deg,#0d1117,#161b22)";

    if (cover) cover.style.setProperty("--reel-cover-bg", gradient);
    if (indexEl) indexEl.textContent = String(index + 1).padStart(2, "0") + " / " + String(projects.length).padStart(2, "0");
    if (nameEl) nameEl.textContent = project.title;
    if (subtitleEl) subtitleEl.textContent = project.subtitle || "";
    if (summaryEl) summaryEl.textContent = project.description || "";

    if (image && project.image) {
        image.src = project.image;
        image.alt = project.title + " project cover";
        image.hidden = false;
        if (project.imageFit === "contain") image.setAttribute("data-fit", "contain");
        else image.removeAttribute("data-fit");
    } else if (image) {
        image.hidden = true;
        image.removeAttribute("src");
        image.alt = "";
    }

    if (motif) motif.style.background = gradient;

    if (techEl) {
        techEl.innerHTML = "";
        (project.tech || []).slice(0, 3).forEach(tech => {
            const chip = document.createElement("span");
            chip.textContent = tech;
            techEl.appendChild(chip);
        });
    }

    const url = getProjectUrl(project);
    if (linkEl && url) {
        linkEl.href = url;
        linkEl.hidden = false;
    } else if (linkEl) {
        linkEl.hidden = true;
    }
}

function initProjectReel() {
    const section = document.getElementById("project-reel");
    const list = document.getElementById("project-reel-list");
    if (!section || !list) return;

    const featuredProjects = getFeaturedProjects();
    if (!featuredProjects.length) {
        section.hidden = true;
        return;
    }

    list.innerHTML = "";
    featuredProjects.forEach((project, index) => {
        list.appendChild(buildProjectReelItem(project, index));
    });

    updateProjectReel(featuredProjects, 0);

    const activateFromUserInput = index => {
        updateProjectReel(featuredProjects, index);
    };

    const buttons = list.querySelectorAll(".project-reel-button");
    buttons.forEach(btn => {
        const activate = () => activateFromUserInput(Number(btn.dataset.index || 0));
        btn.addEventListener("mouseenter", activate);
        btn.addEventListener("focus", activate);
        btn.addEventListener("click", activate);
    });

    // No scroll observer here: hover/focus/click is deterministic and avoids cover/name drift.
}

function mergeGitHubReposIntoArchive(repos, limit) {
    const curatedKeys = buildCuratedProjectKeys();
    const seenGitHubKeys = new Set();

    return repos
        .filter(repo => {
            if (repo.fork || repo.archived) return false;
            if (!repo.description || repo.description.trim().length < 10) return false;
            if (repo.owner && repo.name.toLowerCase() === repo.owner.login.toLowerCase()) return false;
            if (repo.name.toLowerCase().includes(".github.io")) return false;
            if (/^(leetcode|dotfiles|config|readme|profile)/i.test(repo.name)) return false;

            const repoKeys = [repo.name, repo.full_name, repo.html_url].map(normalizeKey).filter(Boolean);
            if (repoKeys.some(key => curatedKeys.has(key) || seenGitHubKeys.has(key))) return false;
            repoKeys.forEach(key => seenGitHubKeys.add(key));
            return true;
        })
        .sort((a, b) => new Date(b.pushed_at || b.updated_at || 0) - new Date(a.pushed_at || a.updated_at || 0))
        .slice(0, limit || 8);
}

// ─── GITHUB AUTO-DISCOVER (collapsed "More on GitHub") ──────────────────────
async function loadGitHubRepos() {
    const section = document.getElementById("github-more-section");
    const list = document.getElementById("github-repos-list");
    const countEl = document.getElementById("github-more-count");
    const btn = document.getElementById("github-more-btn");
    if (!section || !list || !btn) return;

    try {
        const res = await fetch(
            "https://api.github.com/users/dragonscypher/repos?per_page=100&sort=updated",
            { headers: { "Accept": "application/vnd.github+json" } }
        );
        if (!res.ok) throw new Error("GitHub API " + res.status);
        const repos = await res.json();

        const filtered = mergeGitHubReposIntoArchive(repos, 8);

        if (filtered.length === 0) {
            section.hidden = true;
            return;
        }

        list.innerHTML = "";
        filtered.forEach(repo => {
            const li = document.createElement("li");
            li.className = "github-repo-item";

            const link = document.createElement("a");
            link.href = repo.html_url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "github-repo-link";

            const name = document.createElement("span");
            name.className = "github-repo-name";
            name.textContent = repo.name.replace(/[-_]/g, " ");

            const desc = document.createElement("span");
            desc.className = "github-repo-desc";
            desc.textContent = repo.description;

            const meta = document.createElement("span");
            meta.className = "github-repo-meta";
            const updated = new Date(repo.pushed_at || repo.updated_at).getFullYear();
            meta.textContent = (repo.language ? repo.language + " · " : "") + updated;

            link.append(name, desc, meta);
            li.appendChild(link);
            list.appendChild(li);
        });

        if (countEl) countEl.textContent = "(" + filtered.length + ")";
        list.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-label", "Show recent public GitHub repositories");
        btn.classList.remove("open");
        section.hidden = false;

        // Toggle behavior
        btn.onclick = () => {
            const open = btn.getAttribute("aria-expanded") === "true";
            btn.setAttribute("aria-expanded", String(!open));
            btn.setAttribute(
                "aria-label",
                open ? "Show recent public GitHub repositories" : "Hide recent public GitHub repositories"
            );
            btn.classList.toggle("open", !open);
            list.hidden = open;
        };

    } catch (err) {
        console.warn("GitHub repos fetch skipped:", err.message);
        // section stays hidden — graceful fallback
    }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initProjectReel();
    renderProjects("all");
    loadGitHubRepos();
});