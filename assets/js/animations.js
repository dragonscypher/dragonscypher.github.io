'use strict';
/**
 * animations.js — GSAP 3 + ScrollTrigger + Lenis smooth scroll
 * Runs after projects-data.js and script.js (defer order preserved)
 */

// ─── REDUCED MOTION CHECK ────────────────────────────────────────────────────
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── SCROLL PROGRESS BAR ─────────────────────────────────────────────────────
const progressEl = document.querySelector('.scroll-progress');
if (progressEl) {
    window.addEventListener('scroll', () => {
        const scrolled = document.documentElement.scrollTop || document.body.scrollTop;
        const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progressEl.style.setProperty('--scroll', total > 0 ? scrolled / total : 0);
    }, { passive: true });
}

// ─── LENIS SMOOTH SCROLL ─────────────────────────────────────────────────────
let lenis;
if (typeof Lenis !== 'undefined' && !prefersReduced) {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function rafLoop(time) {
        lenis.raf(time);
        requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);

    // Anchor link smooth scroll via Lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                lenis.scrollTo(target, { offset: -16, duration: 1.4 });
            }
        });
    });
}

// ─── GSAP INIT ───────────────────────────────────────────────────────────────
if (typeof gsap !== 'undefined' && !prefersReduced) {

    // Register ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Hook Lenis into ScrollTrigger's scroll events
        if (lenis) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        }
    }

    // ── HERO ENTRANCE ──────────────────────────────────────────────────────────
    const heroAvatar = document.querySelector('.hero-avatar-wrap');
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    const heroName = document.querySelector('.hero-name');
    const heroDesc = document.querySelector('.hero-desc');
    const heroCta = document.querySelector('.hero-cta');
    const heroTags = document.querySelector('.hero-tags');

    if (heroAvatar) {
        gsap.from(heroAvatar, {
            opacity: 0,
            scale: 0.88,
            duration: 0.9,
            ease: 'power2.out',
            delay: 0.15,
        });
    }

    const heroTextEls = [heroEyebrow, heroName, heroDesc, heroCta, heroTags].filter(Boolean);
    if (heroTextEls.length) {
        gsap.from(heroTextEls, {
            opacity: 0,
            y: 28,
            duration: 0.75,
            ease: 'power2.out',
            stagger: 0.1,
            delay: 0.25,
        });
    }

    // ── SCROLL-TRIGGERED SECTION REVEALS ───────────────────────────────────────
    if (typeof ScrollTrigger !== 'undefined') {

        // Article (section) cards slide up on scroll
        document.querySelectorAll('.main-content article').forEach((art) => {
            gsap.from(art, {
                opacity: 0,
                y: 36,
                duration: 0.65,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: art,
                    start: 'top 90%',
                    once: true,
                },
            });
        });

        // Expertise / service cards stagger
        const serviceItems = document.querySelectorAll('.service-item');
        if (serviceItems.length) {
            gsap.from(serviceItems, {
                opacity: 0,
                y: 22,
                duration: 0.55,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: serviceItems[0],
                    start: 'top 85%',
                    once: true,
                },
            });
        }

        // Timeline items slide in from left
        const timelineItems = document.querySelectorAll('.timeline-item');
        if (timelineItems.length) {
            gsap.from(timelineItems, {
                opacity: 0,
                x: -18,
                duration: 0.5,
                stagger: 0.07,
                ease: 'power1.out',
                scrollTrigger: {
                    trigger: timelineItems[0].closest('.timeline-list') || timelineItems[0],
                    start: 'top 82%',
                    once: true,
                },
            });
        }

        // Project cards (re-animate when filter re-renders via MutationObserver)
        function animateProjectCards() {
            const list = document.getElementById('project-list');
            if (!list) return;
            const cards = list.querySelectorAll('.project-item');
            if (!cards.length) return;
            gsap.from(cards, {
                opacity: 0,
                y: 24,
                duration: 0.45,
                stagger: 0.06,
                ease: 'power1.out',
                clearProps: 'opacity,y',
            });
        }

        // Watch for project list mutations (filter changes trigger re-render)
        const projectList = document.getElementById('project-list');
        if (projectList && typeof MutationObserver !== 'undefined') {
            const mo = new MutationObserver(() => {
                // Small delay so DOM settles after renderProjects()
                setTimeout(animateProjectCards, 60);
            });
            mo.observe(projectList, { childList: true });
        }
    }

} // end if gsap

// ─── SCROLL-DRIVEN PROJECT SHOWCASE ─────────────────────────────────────────
(function initShowcase() {
    if (typeof PROJECTS === 'undefined') return;

    const featuredProjects = PROJECTS.filter(p => p.status === 'featured');
    if (!featuredProjects.length) return;

    const stepsContainer = document.getElementById('showcase-steps');
    const showcaseImg    = document.getElementById('showcase-img');
    const gradientEl     = document.getElementById('showcase-gradient-fallback');
    const repoSpan       = document.getElementById('showcase-repo');
    const counterEl      = document.getElementById('showcase-counter');
    const deviceEl       = document.getElementById('showcase-device');

    if (!stepsContainer || !showcaseImg) return;

    const total = featuredProjects.length;

    // Build step elements
    featuredProjects.forEach((p, i) => {
        const step = document.createElement('div');
        step.className = 'showcase-step' + (i === 0 ? ' active' : '');
        step.setAttribute('data-index', i);

        const techHtml = (p.tech || []).slice(0, 5).map(t => `<span>${t}</span>`).join('');
        const numStr = String(i + 1).padStart(2, '0');
        const repoName = p.repoName || p.id;
        const linkHtml = repoName
            ? `<a href="https://github.com/dragonscypher/${repoName}" target="_blank" rel="noopener noreferrer" class="showcase-step-link">View on GitHub →</a>`
            : '';

        step.innerHTML = `
            <div class="showcase-step-number">${numStr}</div>
            <h3 class="showcase-step-title">${p.title}</h3>
            <p class="showcase-step-sub">${p.subtitle || ''}</p>
            <div class="showcase-step-tech">${techHtml}</div>
            ${linkHtml}
        `;
        stepsContainer.appendChild(step);
    });

    function setDevice(project, index) {
        if (project.image) {
            showcaseImg.src = project.image;
            showcaseImg.alt = project.title;
            showcaseImg.style.display = 'block';
            if (gradientEl) gradientEl.style.display = 'none';
        } else {
            showcaseImg.style.display = 'none';
            if (gradientEl) {
                const grad = (typeof PROJECT_GRADIENTS !== 'undefined')
                    ? PROJECT_GRADIENTS[project.gradientId || 0]
                    : '#0d1117';
                gradientEl.style.background = grad;
                gradientEl.style.display = 'block';
            }
        }
        if (repoSpan) repoSpan.textContent = project.repoName || project.id;
        if (counterEl) counterEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    }

    // Set initial device to first project
    setDevice(featuredProjects[0], 0);

    const steps = stepsContainer.querySelectorAll('.showcase-step');

    function activateStep(i) {
        steps.forEach((s, j) => s.classList.toggle('active', j === i));
        setDevice(featuredProjects[i], i);
        // Subtle GSAP tilt on desktop
        if (typeof gsap !== 'undefined' && deviceEl && !prefersReduced && window.innerWidth >= 1024) {
            const tilt = (i / Math.max(total - 1, 1) - 0.5) * 8;
            gsap.to(deviceEl, { rotateY: tilt, rotateX: -1.5, duration: 0.55, ease: 'power2.out' });
        }
    }

    // Use IntersectionObserver for reliable cross-browser step activation
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = parseInt(entry.target.getAttribute('data-index'), 10);
                activateStep(idx);
            }
        });
    }, { rootMargin: '-30% 0px -50% 0px', threshold: 0 });

    steps.forEach(s => io.observe(s));

    // GSAP ScrollTrigger pin on desktop only
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && window.innerWidth >= 1024 && !prefersReduced) {
        const wrap = document.querySelector('.showcase-device-wrap');
        const showcase = document.getElementById('project-showcase');
        if (wrap && showcase) {
            ScrollTrigger.create({
                trigger: showcase,
                pin: wrap,
                start: 'top 80px',
                end: 'bottom bottom',
                pinSpacing: false,
            });
        }
    }
})();

// ─── ACTIVE NAV LINK ON SCROLL ───────────────────────────────────────────────
// Uses IntersectionObserver — works with or without GSAP
(function initActiveNav() {
    const navLinks = document.querySelectorAll('[data-nav-link]');
    if (!navLinks.length) return;

    // Map anchor href → section element
    const sectionMap = new Map();
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const el = document.querySelector(href);
            if (el) sectionMap.set(href, el);
        }
        // Fallback for articles without IDs — match by data-page
        else {
            const text = link.textContent.trim().toLowerCase();
            const pageMap = { about: 'about', experience: 'resume', projects: 'projects', contact: 'contact' };
            const pageKey = pageMap[text];
            if (pageKey) {
                const el = document.querySelector(`[data-page="${pageKey}"]`);
                if (el) sectionMap.set('#' + (el.id || pageKey), el);
            }
        }
    });

    if (!sectionMap.size) return;

    function setActive(href) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === href) link.classList.add('active');
        });
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const match = [...sectionMap.entries()].find(([, el]) => el === entry.target);
                if (match) setActive(match[0]);
            }
        });
    }, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
    });

    sectionMap.forEach(el => io.observe(el));
})();
