/**
 * United Group Inc. — Storm Restoration Animation System
 * 
 * Fast, confident reveal style for roofing/storm restoration
 * - Swift slide transitions (quick response to storms)
 * - Dark + orange branding (authority + warmth)
 * - Bold, impactful reveals (trust-building)
 * - Scroll-triggered effects
 */

// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ============================================================
// 1. HERO SECTION — Storm Restoration Hero Reveal
// ============================================================

gsap.from(".hero-title", {
  opacity: 0,
  y: 30,
  duration: 0.8,
  ease: "power3.out"
});

gsap.from(".hero-subtitle", {
  opacity: 0,
  y: 20,
  duration: 0.8,
  delay: 0.2,
  ease: "power3.out"
});

gsap.from(".hero-cta", {
  opacity: 0,
  scale: 0.9,
  duration: 0.6,
  delay: 0.4,
  ease: "back.out(1.2)"
});

// Parallax background
gsap.to(".hero-bg", {
  yPercent: 20,
  scrollTrigger: {
    trigger: ".hero",
    scrub: 1
  }
});

// ============================================================
// 2. SERVICE CARDS — Roofing Services Reveal
// ============================================================

gsap.from(".service-card", {
  opacity: 0,
  x: -50,
  duration: 0.6,
  stagger: 0.15,
  ease: "power3.out",
  scrollTrigger: {
    trigger: "#services",
    start: "top 80%"
  }
});

// Hover effect: lift + glow
document.querySelectorAll(".service-card").forEach(card => {
  card.addEventListener("mouseenter", () => {
    gsap.to(card, {
      y: -8,
      boxShadow: "0 20px 40px rgba(249, 115, 22, 0.3)",
      duration: 0.3,
      overwrite: "auto"
    });
  });
  
  card.addEventListener("mouseleave", () => {
    gsap.to(card, {
      y: 0,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      duration: 0.3
    });
  });
});

// ============================================================
// 3. BEFORE/AFTER GALLERY — Storm Damage Transformation
// ============================================================

gsap.from(".ba-card", {
  opacity: 0,
  y: 60,
  duration: 0.7,
  stagger: 0.1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: "#gallery",
    start: "top 75%"
  }
});

// Hover: image zoom effect
document.querySelectorAll(".ba-card img").forEach(img => {
  img.addEventListener("mouseenter", () => {
    gsap.to(img, {
      scale: 1.05,
      duration: 0.4,
      ease: "power2.out"
    });
  });
  
  img.addEventListener("mouseleave", () => {
    gsap.to(img, {
      scale: 1,
      duration: 0.3
    });
  });
});

// ============================================================
// 4. SERVICE AREA MAP — Coverage Zone Pulse
// ============================================================

const mapSection = document.querySelector("#service-area");
if (mapSection) {
  gsap.from(".service-map-container", {
    opacity: 0,
    scale: 0.95,
    duration: 0.8,
    ease: "back.out(1.2)",
    scrollTrigger: {
      trigger: "#service-area",
      start: "top 70%"
    }
  });
  
  // Pulsing glow effect on service radius
  gsap.to(".service-radius", {
    boxShadow: [
      "0 0 0 0 rgba(249, 115, 22, 0.7)",
      "0 0 0 20px rgba(249, 115, 22, 0)",
      "0 0 0 0 rgba(249, 115, 22, 0)"
    ],
    duration: 2,
    repeat: -1,
    ease: "power1.inOut"
  });
}

// ============================================================
// 5. TESTIMONIALS — Homeowner Reviews & Success Stories
// ============================================================

gsap.from(".testimonial-card", {
  opacity: 0,
  rotationY: -90,
  x: -30,
  duration: 0.7,
  stagger: 0.12,
  ease: "back.out(1.5)",
  scrollTrigger: {
    trigger: "#testimonials",
    start: "top 75%"
  }
});

// Star rating counter animation
document.querySelectorAll(".star-count").forEach(el => {
  const finalValue = parseInt(el.textContent);
  gsap.from(el, {
    textContent: 0,
    duration: 0.8,
    ease: "power2.out",
    snap: { textContent: 1 },
    scrollTrigger: {
      trigger: el,
      start: "top 80%"
    }
  });
});

// ============================================================
// 6. CERTIFICATIONS — GAF Master Elite Trust Badge
// ============================================================

gsap.from(".certification-badge", {
  opacity: 0,
  scale: 0.7,
  duration: 0.6,
  stagger: 0.1,
  ease: "back.out(1.2)",
  scrollTrigger: {
    trigger: "#certifications",
    start: "top 80%"
  }
});

// Pulsing glow on badges
document.querySelectorAll(".certification-badge").forEach(badge => {
  gsap.to(badge, {
    boxShadow: [
      "0 0 10px rgba(249, 115, 22, 0.5)",
      "0 0 20px rgba(249, 115, 22, 0.8)",
      "0 0 10px rgba(249, 115, 22, 0.5)"
    ],
    duration: 2,
    repeat: -1,
    ease: "sine.inOut"
  });
});

// ============================================================
// 7. COUNTER ANIMATIONS — Numbers Count Up
// ============================================================

gsap.utils.toArray(".stat-number").forEach(el => {
  const finalValue = parseInt(el.textContent);
  gsap.from(el, {
    textContent: 0,
    duration: 1.5,
    ease: "power2.out",
    snap: { textContent: 1 },
    scrollTrigger: {
      trigger: el,
      start: "top 85%"
    }
  });
});

// ============================================================
// 8. CONTACT SECTION — Final CTA Slide Up
// ============================================================

gsap.from(".contact-cta", {
  opacity: 0,
  y: 40,
  duration: 0.8,
  ease: "power3.out",
  scrollTrigger: {
    trigger: "#contact",
    start: "top 80%"
  }
});

// ============================================================
// 9. FOOTER — Fade In
// ============================================================

gsap.from("footer", {
  opacity: 0,
  duration: 1,
  scrollTrigger: {
    trigger: "footer",
    start: "top 95%"
  }
});

// ============================================================
// 10. SCROLL PROGRESS INDICATOR
// ============================================================

// Animated scroll progress bar
const progressBar = document.createElement("div");
progressBar.className = "scroll-progress";
progressBar.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #f97316, #fb923c, #fbbf24);
  z-index: 1000;
  width: 0%;
`;
document.body.appendChild(progressBar);

window.addEventListener("scroll", () => {
  const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  gsap.to(progressBar, {
    width: scrollPercentage + "%",
    duration: 0.1,
    overwrite: "auto"
  });
});

// ============================================================
// 11. SMOOTH SCROLL ANCHOR LINKS
// ============================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 80 },
        duration: 0.8,
        ease: "power2.inOut"
      });
    }
  });
});

console.log("United Group animations loaded ✓");
