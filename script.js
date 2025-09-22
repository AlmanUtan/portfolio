// Subpage functions
//open subpage by number
// Expand/collapse cards inside gallery
document.querySelectorAll(".projectCard .cardPreview").forEach(preview => {
  preview.addEventListener("click", () => {
    const card = preview.closest(".projectCard");
    const isExpanded = card.classList.contains("expanded");

    // Collapse any other expanded card
    document.querySelectorAll(".projectCard.expanded")
      .forEach(c => c.classList.remove("expanded"));

    // Expand clicked card (if it wasn’t already open)
    if (!isExpanded) {
      card.classList.add("expanded");
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
