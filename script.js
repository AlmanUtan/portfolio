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
