// ========== Organic Grid Layout Controller ==========
(function setupOrganicGrid() {
  const container = document.getElementById("galleryList");
  if (!container) return;

  const cards = Array.from(container.querySelectorAll(".projectCard"));

  // Aspect-ratio palette for collapsed previews
  // You can change order or values to tune the look
  const ratios = ["16/9", "4/3", "1/1", "3/2", "2/3"];

  // Assign aspect ratios (unless data-ar is explicitly provided in HTML)
  function assignAspectRatios() {
    cards.forEach((card, i) => {
      if (card.classList.contains("expanded")) {
        card.style.removeProperty("--card-ar");
        return;
      }
      const custom = card.getAttribute("data-ar"); // e.g. "16/9"
      const r = custom || ratios[i % ratios.length];
      // CSS var accepts math form like "16/9"
      card.style.setProperty("--card-ar", r.includes(":") ? r.replace(":", "/") : r);
    });
  }

  // Add some wide tiles on larger screens for a more organic rhythm
  function assignSpans() {
    const width = container.clientWidth;
    const minCol = 260; // must match minmax(260px, 1fr)
    const cols = Math.max(1, Math.floor(width / minCol));

    cards.forEach((card, i) => {
      card.classList.remove("span-2");
      if (card.classList.contains("expanded")) return;

      // Only make some cards wide if we have enough columns
      if (cols >= 3) {
        // Simple deterministic pattern; tweak as you like
        if ((i % 7 === 0) || (i % 7 === 3)) {
          card.classList.add("span-2");
        }
      }
    });
  }

  const applyLayout = () => {
    assignAspectRatios();
    assignSpans();
  };

  // Recompute when the container resizes
  const ro = new ResizeObserver(applyLayout);
  ro.observe(container);

  // Recompute on initial load
  applyLayout();



  // If you also have a close button inside details, call applyLayout()
  // after toggling .expanded off there as well.
})();
// Expand/collapse cards inside gallery
// Suppose applyLayout() is defined earlier in Step 3
document.querySelectorAll(".projectCard .cardPreview").forEach(preview => {
  preview.addEventListener("click", () => {
    const card = preview.closest(".projectCard");
    const isExpanded = card.classList.contains("expanded");

    // Collapse any expanded
    document.querySelectorAll(".projectCard.expanded")
      .forEach(c => c.classList.remove("expanded"));

    if (!isExpanded) {
      card.classList.add("expanded");
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // 🔥 This keeps the organic grid recalculated after the DOM change
    applyLayout();
  });
});

/// ---------------------------------------------------------
// Menu functions
function openMenu() {
  document.querySelector(".hamburger").classList.toggle("is-open");
  document.querySelector(".navigation").classList.toggle("is-active");
}

//Menu a hover rotation picking
document.querySelectorAll(".navigation ul li a").forEach((link) => {
  link.addEventListener("mouseenter", () => {
    const randomAngle = (Math.random() * 10 - 5).toFixed(2); // -5 to +5
    link.style.setProperty("--rand-rotate", `${randomAngle}deg`);
  });
});
