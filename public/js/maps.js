// Service area map for United Group Inc.
// Uses Google Maps embed (no API key required for plain embed iframe with q= query).
// HQ: 1000 Delsea Dr Ste I-4, Westville NJ 08093
// Coverage radius: ~15-20 miles (Haddon, Westmont, Haddonleigh and all of South Jersey).

(function () {
  const HQ_LAT = 39.864;
  const HQ_LNG = -75.131;
  const HQ_QUERY = encodeURIComponent("United Group Inc, 1000 Delsea Dr Ste I-4, Westville NJ 08093");

  // Service neighborhoods (label, lat, lng)
  const neighborhoods = [
    { name: "Westville (HQ)",  lat: 39.864, lng: -75.131, hq: true },
    { name: "Haddon Township", lat: 39.901, lng: -75.073 },
    { name: "Haddonfield",     lat: 39.892, lng: -75.037 },
    { name: "Westmont",        lat: 39.910, lng: -75.072 },
    { name: "Haddon Heights",  lat: 39.879, lng: -75.066 },
    { name: "Audubon",         lat: 39.892, lng: -75.071 },
    { name: "Collingswood",    lat: 39.918, lng: -75.072 },
    { name: "Cherry Hill",     lat: 39.934, lng: -75.030 },
    { name: "Mount Ephraim",   lat: 39.880, lng: -75.092 },
    { name: "Bellmawr",        lat: 39.871, lng: -75.094 }
  ];

  function buildEmbedUrl() {
    // Plain place embed — no API key needed.
    return `https://maps.google.com/maps?q=${HQ_QUERY}&t=&z=11&ie=UTF8&iwloc=&output=embed`;
  }

  function injectMap(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const iframe = document.createElement("iframe");
    iframe.src = buildEmbedUrl();
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "0";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    iframe.title = "United Group Inc. service area map";
    el.appendChild(iframe);
  }

  function injectNeighborhoodList(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.innerHTML = neighborhoods.map(n => `
      <div class="flex items-center gap-2 bg-dark-700 border border-white/5 rounded-lg px-3 py-2 text-sm">
        <span class="w-2 h-2 rounded-full ${n.hq ? "bg-brand-400" : "bg-emerald-400"}"></span>
        <span class="${n.hq ? "font-bold text-white" : "text-gray-300"}">${n.name}</span>
      </div>
    `).join("");
  }

  // Lazy-load images marked with data-src
  function lazyLoadImages() {
    const imgs = document.querySelectorAll("img[data-src]");
    if (!("IntersectionObserver" in window)) {
      imgs.forEach(i => { i.src = i.dataset.src; });
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const img = e.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          obs.unobserve(img);
        }
      });
    }, { rootMargin: "200px" });
    imgs.forEach(i => io.observe(i));
  }

  // Mobile menu toggle
  function setupMobileMenu() {
    const btn = document.getElementById("mobileMenuBtn");
    const menu = document.getElementById("mobileMenu");
    if (!btn || !menu) return;
    btn.addEventListener("click", () => {
      const open = menu.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => menu.classList.add("hidden")));
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectMap("serviceAreaMap");
    injectNeighborhoodList("neighborhoodList");
    lazyLoadImages();
    setupMobileMenu();
  });

  window.UGR = Object.assign(window.UGR || {}, {
    HQ: { lat: HQ_LAT, lng: HQ_LNG, query: HQ_QUERY },
    neighborhoods
  });
})();
