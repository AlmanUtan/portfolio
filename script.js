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

  // Decide span=1 or 2 for a card
  function decideSpan(card, cols, rand) {
    // If explicitly featured, prefer 2
    if (card.dataset.featured) return Math.min(2, cols);

    const cat = colsCategory(cols);
    const r = rand();
    // Likelihoods (tuned to emulate index2 layout flavor)
    const chanceWide = 0.35;
    const chanceMedium = 0.15;
    const chanceNarrow = 0.0;

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
    if (!c.dataset.ratio) c.dataset.ratio = defaultRatios[i % defaultRatios.length];
  });

  // Stable per-card RNG for span decisions
  const perCardRand = cards.map((_, i) => mulberry32(1000 + i));
  // Organic order: seeded shuffle so “big” items interleave
  const layoutOrder = shuffleStable(cards, 2025);

  // Position cache so we can scroll to a card after layout
  const posCache = new Map();

  function layout() {
    // Enable masonry mode
    grid.classList.add("masonry-on");

    // Use the scroller's real inner width (minus padding) for accurate columns
    const scrollerEl = scroller || grid.parentElement || document.body;
    const cs = getComputedStyle(scrollerEl);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const avail = Math.max(0, (scrollerEl.clientWidth || window.innerWidth) - padL - padR);

    const cols = decideCols(avail);
    const colWidth = Math.floor((avail - (cols - 1) * GAP) / cols);

    // Set an explicit container width so the grid is centered correctly
    const containerWidth = cols * colWidth + (cols - 1) * GAP;
    grid.style.width = containerWidth + "px";

  // Track column heights
  const heights = Array(cols).fill(0);

    // Place cards in shuffled order
    layoutOrder.forEach((card, i) => {
      const isExpanded = card.classList.contains("expanded");
      // Decide span and ratio
      let span = isExpanded ? cols : Math.min(decideSpan(card, cols, perCardRand[i]), cols);
      const ratio = parseRatio(card.dataset.ratio || "1:1");

      const width = span * colWidth + (span - 1) * GAP;
      let height;

      if (isExpanded) {
        // Measure expanded height at full width
        // Temporarily set width to measure true scrollHeight
        const prevTransform = card.style.transform;
        const prevWidth = card.style.width;

        card.style.width = width + "px";
        card.style.transform = "translate(-99999px, -99999px)"; // keep off-screen during measure
        height = card.scrollHeight;

        // Restore for positioning below
        card.style.transform = prevTransform;
        card.style.width = prevWidth;
      } else {
        // Compact height from aspect ratio (preview)
        height = Math.round(width * (ratio.h / ratio.w));
      }

      // Greedy placement: best Y across the span
      let bestCol = 0;
      let bestY = Infinity;
      for (let c = 0; c <= cols - span; c++) {
        const y = Math.max(...heights.slice(c, c + span));
        if (y < bestY) {
          bestY = y;
          bestCol = c;
        }
      }

      const x = bestCol * (colWidth + GAP);

      // Apply absolute positioning
      card.style.position = "absolute";
      card.style.width = width + "px";
      card.style.height = height + "px";
      card.style.transform = `translate(${x}px, ${bestY}px)`;

      posCache.set(card, { x, y: bestY });

      // Update column heights
      const newY = bestY + height + GAP;
      for (let c = bestCol; c < bestCol + span; c++) {
        heights[c] = newY;
      }
    });

    // Container height
    const totalHeight = Math.max(...heights, 0);
    grid.style.height = totalHeight + "px";
  }
    // Re-layout when the scroll area size changes (e.g., overlay opening or viewport changes)
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => layout());
      ro.observe(scroller || grid.parentElement || document.body);
}
  function collapseAll(except) {
    cards.forEach((c) => {
      if (c !== except) c.classList.remove("expanded");
    });
  }

  // Click-to-expand on the preview area
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
      layout();
      // If expanded, scroll it into view within the gallery scroller
      if (willExpand) {
        const pos = posCache.get(card);
        if (scroller && pos) {
          scroller.scrollTo({
            top: Math.max(0, pos.y - 12),
            behavior: "smooth",
          });
        }
      }
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
  window.openSubpage = function openSubpage(pageNumber) {
    // Ask the 3D App to open the overlay (we exposed window.App in index.html)
    if (window.App && typeof window.App.openGallery === "function") {
      window.App.openGallery();
      if (window.App && typeof window.App.openGallery === "function") {
        window.App.openGallery();
        // nudge a few times during the opening animation so positions lock in
        requestAnimationFrame(layout);
        setTimeout(layout, 120);
}
    }

    const target = cards.find((c) => String(c.dataset.page) === String(pageNumber));
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
  };
})();