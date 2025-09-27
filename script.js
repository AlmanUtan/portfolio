/* script.js
   - Hamburger menu toggle
   - Organic masonry layout for .organicGrid
   - Click-to-expand cards
   - openSubpage(pageNumber) for 3D tile clicks
*/

(function () {

  // -----------------------------
  // Hamburger menu
  // -----------------------------
  window.openMenu = function openMenu() {
    const nav = document.querySelector(".navigation");
    const burger = document.querySelector(".hamburger");
    if (!nav || !burger) return;
    const isActive = nav.classList.toggle("is-active");
    burger.classList.toggle("is-open", isActive);
  };

  //Menu a hover rotation picking
  document.querySelectorAll(".navigation ul li a").forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const randomAngle = (Math.random() * 10 - 5).toFixed(2); // -5 to +5
      link.style.setProperty("--rand-rotate", `${randomAngle}deg`);
    });
  });
  // -----------------------------
  // Masonry + Expand for Gallery
  // -----------------------------
  const grid = document.getElementById("galleryList");
  const scroller = document.getElementById("galleryScroll");
  if (!grid) return; // nothing to do if gallery not present

  let cards = Array.from(grid.querySelectorAll(".projectCard"));

  // If no cards, nothing to do
  if (!cards.length) return;

  // Use your CSS gap of 18px
  const GAP = 18;
  // Column sizing (tuned to keep similar feel to index2)
  const MIN_COL_WIDTH = 200;
  const MAX_COL_WIDTH = 300;
  const MIN_COLS = 2;
  const MAX_COLS = 8;

  

  // --- PATCH: sync dataset.ratio from CSS --card-ar ---
  cards.forEach((card) => {
    
    if (!card.dataset.ratio) {
      const cp = card.querySelector(".cardPreview");
      if (cp) {
        const ar = getComputedStyle(cp).getPropertyValue("--card-ar").trim(); // e.g. "16/9"
        if (ar) {
          card.dataset.ratio = ar.includes("/")
            ? ar.replace("/", ":") // normalize to "W:H"
            : ar;
        }
      }
    }
  });
  

  // Seeded RNG (stable organic order)
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffleStable(arr, seed = 1337) {
    const rand = mulberry32(seed);
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Parse string "W:H"
  function parseRatio(str) {
    if (!str) return { w: 1, h: 1 };
    const [w, h] = String(str).split(/[:/x]/).map(Number);
    return { w: w || 1, h: h || 1 };
  }

  // Decide how many columns we can fit
  function decideCols(avail) {
    // Try with min col width
    let cols = Math.max(
      MIN_COLS,
      Math.min(MAX_COLS, Math.floor((avail + GAP) / (MIN_COL_WIDTH + GAP)))
    );
    // Soft cap using max col width
    cols = Math.max(
      MIN_COLS,
      Math.min(cols, Math.floor((avail + GAP) / (MAX_COL_WIDTH + GAP)) || cols)
    );
    return Math.max(MIN_COLS, Math.min(MAX_COLS, cols));
  }

  function colsCategory(cols) {
    if (cols <= 3) return "narrow";
    if (cols <= 5) return "medium";
    return "wide";
  }

  function decideSpan(card, cols, rand) {
  const tier = card.dataset.tier || "standard";

  // Main projects: bigger in compact grid
  if (tier === "main") return Math.min(2, cols);

  // You can keep some randomness for non-main if you like, or force 1:
  // return 1;

  // If you want to keep your existing flavor, slightly toned down:
  const cat = colsCategory(cols);
  const r = rand();
  const chanceWide = 0.2;   // lower than before
  const chanceMedium = 0.1;
  if (cat === "wide" && cols >= 4 && r < chanceWide) return 2;
  if (cat === "medium" && cols >= 3 && r < chanceMedium) return 2;
  return 1;
}

  // If user didn’t mark featured items, mark first 3 as featured big 16:9
  const anyFeatured = cards.some((c) => c.hasAttribute("data-featured"));
  if (!anyFeatured) {
    cards.slice(0, 3).forEach((c) => {
      c.dataset.featured = "1";
      if (!c.dataset.ratio) c.dataset.ratio = "16:9";
    });
  }

  // Default ratios if not provided per card:
  // Slight variety across the list: 1:1, 3:2, 16:9 repeated
  const defaultRatios = ["1:1", "3:2", "16:9"];
  cards.forEach((c, i) => {
    if (!c.dataset.ratio)
      c.dataset.ratio = defaultRatios[i % defaultRatios.length];
  });

  // Stable per-card RNG for span decisions
  const perCardRand = cards.map((_, i) => mulberry32(1000 + i));
  // Organic order: seeded shuffle so “big” items interleave
  const layoutOrder = shuffleStable(cards, 2025);

  // Position cache so we can scroll to a card after layout
  const posCache = new Map();
function measureExpandedHeight(card, width) {
  const clone = card.cloneNode(true);
  clone.classList.add("expanded");

  // Neutralize layout/positioning so we can measure natural height
  clone.style.position = "static";
  clone.style.visibility = "hidden";
  clone.style.transform = "none";
  clone.style.width = width + "px";
  clone.style.height = "auto";
  clone.style.left = "auto";
  clone.style.top = "auto";

  // Expanded view: hide preview, show details
  const prev = clone.querySelector(".cardPreview");
  if (prev) prev.style.display = "none";
  const details = clone.querySelector(".cardDetails");
  if (details) details.style.display = "block";

  // Ensure the aspect variable exists on the clone
  const origWrapper = card.querySelector(".videoWrapper");
  const cloneWrapper = clone.querySelector(".videoWrapper");
  if (cloneWrapper) {
    // Try to read the original custom prop; if missing, use data-ratio
    let ar = "";
    if (origWrapper) {
      ar = getComputedStyle(origWrapper).getPropertyValue("--video-ar").trim();
    }
    if (!ar) {
      // fall back to data-ratio like "16:9" -> "16/9"
      const dr = (card.dataset.ratio || "16:9").replace(":", "/");
      ar = dr;
    }
    cloneWrapper.style.setProperty("--video-ar", ar || "16/9");
  }

  grid.appendChild(clone);
  // Force layout, then measure
  const h = Math.ceil(clone.getBoundingClientRect().height);
  grid.removeChild(clone);
  return h;
}
  function layout() {
  // Enable masonry mode
  grid.classList.add("masonry-on");

  // Use the scroller’s inner width (minus padding) for accurate columns
  const scrollerEl = scroller || grid.parentElement || document.body;
  const cs = getComputedStyle(scrollerEl);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const avail = Math.max(0, (scrollerEl.clientWidth || window.innerWidth) - padL - padR);

  const cols = decideCols(avail);
  const colWidth = Math.floor((avail - (cols - 1) * GAP) / cols);

  // Explicit container width so absolute children center correctly
  const containerWidth = cols * colWidth + (cols - 1) * GAP;
  grid.style.width = containerWidth + "px";

  // Track column heights
  const heights = Array(cols).fill(0);

  // Place cards in seeded “organic” order
  layoutOrder.forEach((card, i) => {
    const isExpanded = card.classList.contains("expanded");

     // Span decision
        const baseSpan = Math.min(decideSpan(card, cols, perCardRand[i]), cols);
        const tier = (card.dataset.tier || "").toLowerCase();

        let span;
        if (isExpanded) {
          if (tier === "main") {
            span = cols; // main projects take full width when expanded
          } else {
            const factor = parseFloat(card.dataset.expandFactor || "1.5");
            const desired = Math.max(1, Math.round(baseSpan * factor));
            span = Math.min(desired, cols);
          }
        } else {
          span = baseSpan;
        }
      const ratio = parseRatio(card.dataset.ratio || "1:1");

    const width = span * colWidth + (span - 1) * GAP;
    let height;

    if (isExpanded) {
      // Robust: measure expansion height using a hidden clone
      height = measureExpandedHeight(card, width);
    } else {
      // Compact: derive from aspect ratio
      height = Math.round(width * (ratio.h / ratio.w));
    }

      // Greedy placement across columns
      let bestCol = 0, bestY = Infinity;
      for (let c = 0; c <= cols - span; c++) {
        const y = Math.max(...heights.slice(c, c + span));
        if (y < bestY) { bestY = y; bestCol = c; }
      }

    const x = bestCol * (colWidth + GAP);
      
    // Higher y -> above lower y (prevents underlying peeking through)
    card.style.zIndex = String(100 + Math.floor(bestY));
    // Apply absolute positioning
    card.style.position = "absolute";
    card.style.width = width + "px";
    card.style.height = height + "px";
    card.style.transform = `translate(${x}px, ${bestY}px)`;

    posCache.set(card, { x, y: bestY });

    // Update column heights
    const newY = bestY + height + GAP;
    for (let c = bestCol; c < bestCol + span; c++) heights[c] = newY;
  });

  // Container height
  const totalHeight = Math.max(...heights, 0);
  grid.style.height = totalHeight + "px";
}


 function collapseAll(except) {
  cards.forEach((c) => {
    if (c !== except) {
      c.classList.remove("expanded");
      const dv = c.querySelector('.cardDetails video');
      if (dv) { try { dv.pause(); dv.currentTime = 0; } catch(e){} }
    }
  });
}

// ---- Fullscreen modal helpers for MAIN projects ----
function ensureProjectModal() {
  let modal = document.getElementById('projectModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'projectModal';
  modal.style.display = 'none'; // initial, controlled by class
  modal.innerHTML = `
    <div class="modalBox">
      <div class="modalHeader">
        <div class="modalTitle"></div>
        <button class="modalClose" type="button">Close</button>
      </div>
      <div class="modalVideoWrap"></div>
      <div class="modalContent"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // Backdrop and button close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProjectModal();
  });
  modal.querySelector('.modalClose').addEventListener('click', closeProjectModal);

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
  });

  return modal;
}

function openProjectModal(card) {
  const modal = ensureProjectModal();

  // Apply CSS class to show (your CSS should define #projectModal and .is-open)
  modal.id = 'projectModal'; // ensure id exists
  modal.classList.add('is-open');
  modal.style.display = ''; // let CSS take over

  const titleEl = modal.querySelector('.modalTitle');
  const videoWrap = modal.querySelector('.modalVideoWrap');
  const content = modal.querySelector('.modalContent');

  // Title from card
  const name = (card.querySelector('.projectName')?.textContent || '').trim();
  titleEl.textContent = name || 'Project';

  // Aspect ratio for the big video
  const details = card.querySelector('.cardDetails');
  let ar = details ? getComputedStyle(details).getPropertyValue('--video-ar').trim() : '';
  if (!ar) ar = (card.dataset.ratio || '16:9').replace(':', '/');
  videoWrap.style.setProperty('--video-ar', ar || '16/9');

  // Build a playable video from the detail source
  const srcEl = card.querySelector('.cardDetails source');
  const vidSrc = srcEl?.getAttribute('src') || '';
  const vidType = srcEl?.getAttribute('type') || '';

  videoWrap.innerHTML = '';
  const v = document.createElement('video');
  v.setAttribute('controls', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('preload', 'metadata');
  if (vidSrc) {
    const s = document.createElement('source');
    s.src = vidSrc;
    if (vidType) s.type = vidType;
    v.appendChild(s);
  }
  videoWrap.appendChild(v);

  // Try autoplay (muted for reliability on all browsers)
try {
  v.muted = true;           // required by iOS/Safari autoplay policies
  const p = v.play();
  if (p && typeof p.then === 'function') p.catch(() => {});
} catch (e) {}

  // Clone description/process into modal
  content.innerHTML = '';
  const desc = card.querySelector('.projectDescription');
  const proc = card.querySelector('.projectProcess');
  if (desc) content.appendChild(desc.cloneNode(true));
  if (proc) content.appendChild(proc.cloneNode(true));

  // Optional autoplay muted:
  // v.muted = true;
  // v.play().catch(() => {});
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;
  // Pause any playing video
  modal.querySelectorAll('video').forEach(vid => { try { vid.pause(); } catch(e){} });
  modal.classList.remove('is-open');
  // Hide via inline display in case CSS isn't loaded yet
  modal.style.display = 'none';
}

// ---- Click-to-expand on the preview area (REPLACEMENT) ----
cards.forEach((card) => {
 
  
  const preview = card.querySelector(".cardPreview");
  if (!preview) return;

  preview.addEventListener("click", () => {
    const willExpand = !card.classList.contains("expanded");

    if (willExpand) {
      collapseAll(card);
      card.classList.add("expanded");
    } else {
      card.classList.remove("expanded");
    }

    // Let the DOM apply the expanded state before measuring/layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        layout();

        // Autoplay detail video when expanded, pause when collapsed
        const detailVid = card.querySelector(".cardDetails video");
        if (detailVid) {
          if (willExpand) {
            try {
              detailVid.muted = false; // autoplay policy safe
              const p = detailVid.play();
              if (p && typeof p.then === "function") p.catch(() => {});
            } catch (e) {}
          } else {
            try { detailVid.pause(); } catch (e) {}
          }
        }

        if (willExpand) {
          const pos = posCache.get(card);
          if (scroller && pos) {
            scroller.scrollTo({
              top: Math.max(0, pos.y - 12),
              behavior: "smooth",
            });
          }
        }
        let btn = card.querySelector('.cardCollapse');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'cardCollapse';
    btn.type = 'button';
    btn.textContent = 'Close';
    card.appendChild(btn);
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (card.classList.contains('expanded')) {
      card.classList.remove('expanded');
      // Pause any playing detail video
      const dv = card.querySelector('.cardDetails video');
      if (dv) { try { dv.pause(); } catch(e){} }
      layout();
    }
  });
});

// ESC closes expanded (in-grid) cards, unless the fullscreen modal is open
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const modal = document.getElementById('projectModal');
  if (modal && modal.classList.contains('is-open')) return; // modal has its own ESC

  const anyExpanded = cards.some(c => c.classList.contains('expanded'));
  if (anyExpanded) {
    collapseAll();
    layout();
  }
      });
    });
  });
});

// Re-layout on resize
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layout, 60);
});

// Initial layout
layout();

  // -----------------------------
  // openSubpage(pageNumber) used by the 3D click handler
  // -----------------------------
  // Replace the entire openSubpage with this
window.openSubpage = function openSubpage(pageNumber) {
  // Open gallery overlay
  if (window.App && typeof window.App.openGallery === "function") {
    window.App.openGallery();
    // Re-layout as overlay animates open
    requestAnimationFrame(layout);
    setTimeout(layout, 140);
  }

  // Find the matching card
  const target = cards.find(
    (c) => String(c.dataset.page) === String(pageNumber)
  );
  if (!target) return;

  // Expand target in-grid (uniform behavior for main & non-main)
  collapseAll(target);
  target.classList.add("expanded");
  layout();

  // Autoplay detail video
  const dv = target.querySelector(".cardDetails video");
  if (dv) {
    try {
      dv.muted = true;
      const p = dv.play();
      if (p && typeof p.then === "function") p.catch(() => {});
    } catch (e) {}
  }

  // Scroll to it
  const pos = posCache.get(target);
  if (scroller && pos) {
    setTimeout(() => {
      scroller.scrollTo({
        top: Math.max(0, pos.y - 12),
        behavior: "smooth",
      });
    }, 120);
  }
};

    const target = cards.find(
      (c) => String(c.dataset.page) === String(pageNumber)
    );
    if (!target) return;

    // Expand target and collapse others
    collapseAll(target);
    target.classList.add("expanded");
    layout();

    // Scroll to it
    const pos = posCache.get(target);
    if (scroller && pos) {
      // slight delay to allow any CSS lerp to progress
      setTimeout(() => {
        scroller.scrollTo({ top: Math.max(0, pos.y - 12), behavior: "smooth" });
      }, 120);
    }
  
})();
