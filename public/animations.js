/* United Group Restoration — Premium Animations
 * GSAP + ScrollTrigger. iOS-style snappy physics. Dark + orange.
 * Loaded after GSAP/ScrollTrigger CDN.
 */
(() => {
  if (typeof window === 'undefined') return;
  const ready = (fn) => (document.readyState !== 'loading')
    ? fn()
    : document.addEventListener('DOMContentLoaded', fn);

  ready(() => {
    if (!window.gsap) { console.warn('GSAP not loaded'); return; }
    const { gsap } = window;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Respect reduced motion
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      document.querySelectorAll('[data-anim]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    // iOS-style snappy ease
    const SNAP = 'power3.out';
    const SNAP_IN = 'power3.inOut';
    const BOUNCE = 'back.out(1.6)';

    /* ------ Scroll progress bar ------ */
    const bar = document.getElementById('scroll-progress');
    if (bar && window.ScrollTrigger) {
      gsap.to(bar, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.15 }
      });
    }

    /* ------ HERO: bold text slide-in + CTA bounce ------ */
    const heroTL = gsap.timeline({ defaults: { ease: SNAP, duration: 0.8 } });
    heroTL
      .from('[data-hero-eyebrow]', { y: 20, opacity: 0, duration: 0.5 })
      .from('[data-hero-line]', { y: 60, opacity: 0, stagger: 0.08, duration: 0.7 }, '-=0.25')
      .from('[data-hero-sub]', { y: 24, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('[data-hero-cta]', { y: 30, opacity: 0, scale: 0.9, stagger: 0.08, ease: BOUNCE, duration: 0.7 }, '-=0.3')
      .from('[data-hero-stat]', { y: 20, opacity: 0, stagger: 0.07, duration: 0.5 }, '-=0.4');

    /* ------ Generic reveal helper ------ */
    const reveal = (selector, opts = {}) => {
      gsap.utils.toArray(selector).forEach((el) => {
        gsap.from(el, Object.assign({
          y: 50,
          opacity: 0,
          duration: 0.7,
          ease: SNAP,
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        }, opts));
      });
    };

    /* ------ Section eyebrows / titles ------ */
    reveal('[data-anim="title"]', { y: 40, duration: 0.6 });
    reveal('[data-anim="sub"]', { y: 24, duration: 0.55 });

    /* ------ SERVICES: staggered card reveal left→right ------ */
    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-services-grid]').forEach((grid) => {
        const cards = grid.querySelectorAll('[data-service-card]');
        gsap.from(cards, {
          x: -60,
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.09,
          ease: SNAP,
          scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none reverse' }
        });
      });
    }

    /* ------ GALLERY: slide-up + zoom on hover ------ */
    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-gallery-grid]').forEach((grid) => {
        const items = grid.querySelectorAll('[data-gallery-item]');
        gsap.from(items, {
          y: 80,
          opacity: 0,
          scale: 0.96,
          duration: 0.7,
          stagger: 0.08,
          ease: SNAP,
          scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none reverse' }
        });
      });
    }
    document.querySelectorAll('[data-gallery-item]').forEach((item) => {
      const img = item.querySelectorAll('img');
      item.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.06, duration: 0.5, ease: SNAP }));
      item.addEventListener('mouseleave', () => gsap.to(img, { scale: 1.0, duration: 0.5, ease: SNAP }));
    });

    /* ------ MAP: pulse glow ------ */
    const mapWrap = document.querySelector('[data-map-pulse]');
    if (mapWrap) {
      gsap.to(mapWrap, {
        boxShadow: '0 0 60px rgba(249,115,22,0.55), 0 0 0 1px rgba(249,115,22,0.35)',
        repeat: -1,
        yoyo: true,
        duration: 1.6,
        ease: 'sine.inOut'
      });
      reveal('[data-map-pulse]', { y: 60 });
    }

    /* ------ TESTIMONIALS: card flip on reveal ------ */
    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-testimonial-card]').forEach((card, i) => {
        gsap.fromTo(card,
          { rotationY: -90, opacity: 0, transformPerspective: 800, transformOrigin: 'left center' },
          {
            rotationY: 0, opacity: 1, duration: 0.8, ease: SNAP, delay: i * 0.08,
            scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );
      });
    }

    /* ------ CERTIFICATIONS: badge glow + scale ------ */
    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-cert-badge]').forEach((badge, i) => {
        gsap.fromTo(badge,
          { scale: 0.6, opacity: 0 },
          {
            scale: 1, opacity: 1, duration: 0.7, ease: BOUNCE, delay: i * 0.06,
            scrollTrigger: { trigger: badge, start: 'top 88%', toggleActions: 'play none none reverse' }
          }
        );
        // subtle ambient glow loop
        gsap.to(badge, {
          boxShadow: '0 0 30px rgba(249,115,22,0.45)',
          repeat: -1, yoyo: true, duration: 2 + i * 0.15, ease: 'sine.inOut'
        });
      });
    }

    /* ------ CONTACT: final CTA slide ------ */
    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-contact-cta]').forEach((el) => {
        gsap.from(el, {
          y: 80, opacity: 0, scale: 0.95, duration: 0.9, ease: SNAP,
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });
    }

    /* ------ FOOTER: fade in ------ */
    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-footer]').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 20, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none reverse' }
        });
      });
    }

    /* ------ Counter animations ------ */
    const animateCounter = (el) => {
      const target = parseFloat(el.dataset.count || '0');
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: SNAP_IN,
        onUpdate: () => {
          const val = decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString();
          el.textContent = prefix + val + suffix;
        }
      });
    };
    if (window.ScrollTrigger) {
      gsap.utils.toArray('[data-count]').forEach((el) => {
        window.ScrollTrigger.create({
          trigger: el, start: 'top 90%', once: true,
          onEnter: () => animateCounter(el)
        });
      });
    }

    /* ------ Hover micro-interactions on buttons/cards ------ */
    document.querySelectorAll('[data-hover-lift]').forEach((el) => {
      el.addEventListener('mouseenter', () => gsap.to(el, { y: -4, duration: 0.25, ease: SNAP }));
      el.addEventListener('mouseleave', () => gsap.to(el, { y: 0, duration: 0.25, ease: SNAP }));
    });
    document.querySelectorAll('[data-hover-pop]').forEach((el) => {
      el.addEventListener('mouseenter', () => gsap.to(el, { scale: 1.04, duration: 0.2, ease: SNAP }));
      el.addEventListener('mouseleave', () => gsap.to(el, { scale: 1.0, duration: 0.2, ease: SNAP }));
    });

    /* ------ Smooth in-page anchor scrolling ------ */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });

    /* ------ Mobile nav toggle ------ */
    const navBtn = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-mobile');
    if (navBtn && navMenu) {
      navBtn.addEventListener('click', () => {
        const open = navMenu.classList.toggle('open');
        navMenu.style.maxHeight = open ? navMenu.scrollHeight + 'px' : '0px';
      });
      navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        navMenu.classList.remove('open'); navMenu.style.maxHeight = '0px';
      }));
    }
  });
})();
