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
    const total    = document.documentElement.scrollHeight - document.documentElement.clientHeight;
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
      const target   = document.querySelector(targetId);
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
  const heroAvatar  = document.querySelector('.hero-avatar-wrap');
  const heroEyebrow = document.querySelector('.hero-eyebrow');
  const heroName    = document.querySelector('.hero-name');
  const heroDesc    = document.querySelector('.hero-desc');
  const heroCta     = document.querySelector('.hero-cta');
  const heroTags    = document.querySelector('.hero-tags');

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
