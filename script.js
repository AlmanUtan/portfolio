// Subpage functions
//open subpage by number
function openSubpage(pageNumber) {
  document.getElementById("subpage-" + pageNumber).style.display = "flex";
}
//close all subpages
function closeSubpage() {
  const subpages = document.querySelectorAll(".subpage");
  subpages.forEach((page) => (page.style.display = "none"));
}

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
