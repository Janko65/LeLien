// ======================
// DONNÉES DE BASE & ÉTAT
// ======================
const codesValides = {
  "CADRE1": { nom: "Jean Dupont", métier: "métier1", role: "user" },
  "TECH1":  { nom: "Marie Martin", métier: "métier2", role: "user" },
  "DIR1":   { nom: "Directeur Dupuis", métier: "métier3", role: "user" },
  "ADMIN0": { nom: "Admin", métier: "admin", role: "admin" }
};

const metiers = {
  métier1: { label: "Cadres",      color: "var(--métier1-color)" },
  métier2: { label: "Techniciens", color: "var(--métier2-color)" },
  métier3: { label: "Dirigeants",  color: "var(--métier3-color)" },
  admin:   { label: "Admin",       color: "var(--admin-color)" }
};

// Catégories dynamiques
let categories = JSON.parse(localStorage.getItem("categories")) || {
  catégorie1: { label: "Planning",  icon: "", color: "#FF9800" },
  catégorie2: { label: "Entretien", icon: "", color: "#00BCD4" },
};

let editingCategorieId = null;
let currentUser = null;
let problematiques = JSON.parse(localStorage.getItem("problematiques")) || [];
let currentTheme = localStorage.getItem("theme") || "dark";
let currentTab = "byProblematique";
let editingId = null;

// ======================
// UTILS
// ======================
function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-FR");
}

function getUserProblematiques() {
  if (currentUser.role === "admin") return problematiques;
  return problematiques.filter(p => p.diffusion === "all" || p.métier === currentUser.métier);
}

function updateUI() {
  if (!currentUser) return;
  document.getElementById("userName").textContent = currentUser.nom;
  const userProblematiques = getUserProblematiques();
  document.getElementById("userStatus").textContent =
    `${userProblematiques.length} événement${userProblematiques.length > 1 ? "s" : ""}`;
  renderProblematiques();
}

// ======================
// GESTION UTILISATEUR
// ======================
function setUser(user) {
  currentUser = user;

  const authScreen   = document.getElementById("authScreen");
  const mainScreen   = document.getElementById("mainScreen");
  const bottomBar    = document.getElementById("bottomBar");
  const searchBanner = document.getElementById("searchBanner");

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    if (authScreen)  authScreen.style.display  = "none";
    if (mainScreen)  mainScreen.style.display  = "block";
    if (bottomBar)   bottomBar.style.display   = "flex";
    if (searchBanner)searchBanner.style.display= "flex";
    updateUI();
    showTab(currentTab);
  } else {
    localStorage.removeItem("user");
    if (authScreen)  authScreen.style.display  = "flex";
    if (mainScreen)  mainScreen.style.display  = "none";
    if (bottomBar)   bottomBar.style.display   = "none";
    if (searchBanner)searchBanner.style.display= "none";
  }
}

// ======================
// MODALES
// ======================
function showModal(id) { document.getElementById(id).style.display = "flex"; }
function hideModal(id) { document.getElementById(id).style.display = "none"; }

function setupModalClose() {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => { if (e.target === modal) hideModal(modal.id); });
  });
}

// ======================
// CRUD PROBLÉMATIQUES
// ======================
function showProblematiqueModal() {
  editingId = null;
  document.getElementById("modalTitle").textContent = "Nouvelle problématique";
  document.getElementById("problematiqueTitre").value = "";
  document.getElementById("problematiqueDescription").value = "";
  document.getElementById("problematiqueCategorie").value = "";
  document.getElementById("problematiqueDiffusion").value = "all";

  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("problematiqueDateDeb");
  dateInput.value = today;
  dateInput.min = today;

  document.getElementById("saveProblematiqueBtn").style.display   = "block";
  document.getElementById("deleteProblematiqueBtn").style.display = "none";

  updateCategorieSelect();
  showModal("problematiqueModal");
}

function openProblematique(id) {
  const p = problematiques.find(p => p.id === id);
  if (!p) return;

  editingId = id;

  document.getElementById("modalTitle").textContent = "Consulter la problématique";
  document.getElementById("problematiqueTitre").value        = p.titre;
  document.getElementById("problematiqueDescription").value  = p.description;
  document.getElementById("problematiqueCategorie").value    = p.categorie;
  document.getElementById("problematiqueDiffusion").value    = p.diffusion;
  document.getElementById("problematiqueDateDeb").value      =
    new Date(p.dateDeb).toISOString().split("T")[0];

  const canEdit = currentUser.role === "admin" || p.métier === currentUser.métier;
  ["problematiqueTitre","problematiqueDescription","problematiqueCategorie",
   "problematiqueDiffusion","problematiqueDateDeb"]
    .forEach(id => document.getElementById(id).disabled = !canEdit);

  document.getElementById("saveProblematiqueBtn").style.display   = canEdit ? "block" : "none";
  document.getElementById("deleteProblematiqueBtn").style.display = canEdit ? "block" : "none";

  showModal("problematiqueModal");
}

function saveProblematique() {
  const titre       = document.getElementById("problematiqueTitre").value.trim();
  const description = document.getElementById("problematiqueDescription").value.trim();
  const categorie   = document.getElementById("problematiqueCategorie").value;
  const diffusion   = document.getElementById("problematiqueDiffusion").value;
  const dateDeb     = document.getElementById("problematiqueDateDeb").value;

  const métier = editingId
    ? problematiques.find(p => p.id === editingId).métier
    : currentUser.métier;

  if (!titre || !description) {
    alert("Titre et description requis !");
    return;
  }
  if (!categorie) {
    alert("Veuillez sélectionner une catégorie !");
    return;
  }

  const problematique = {
    id: editingId || Date.now().toString(),
    titre, description, categorie, diffusion,
    dateDeb: new Date(dateDeb).toISOString(),
    métier, nomUtilisateur: currentUser.nom
  };

  if (editingId) problematiques = problematiques.map(p => p.id === editingId ? problematique : p);
  else problematiques.push(problematique);

  localStorage.setItem("problematiques", JSON.stringify(problematiques));
  hideModal("problematiqueModal");
  updateUI();
}

function deleteProblematique() {
  if (!confirm("Supprimer cette problématique ?")) return;
  problematiques = problematiques.filter(p => p.id !== editingId);
  localStorage.setItem("problematiques", JSON.stringify(problematiques));
  hideModal("problematiqueModal");
  updateUI();
}

function cancelProblematique() { hideModal("problematiqueModal"); }

function searchProblematiques() {
  const input = document.getElementById("searchInput");
  const query = (input?.value || "").toLowerCase();
  const userProblematiques = getUserProblematiques();
  let filtered = userProblematiques;

  if (query.trim() !== "") {
    filtered = userProblematiques.filter(p =>
      p.titre.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (categories[p.categorie]?.label || "").toLowerCase().includes(query) ||
      (metiers[p.métier]?.label || "").toLowerCase().includes(query) ||
      formatDate(p.dateDeb).toLowerCase().includes(query)
    );
  }

  if (currentTab === "byMetier") renderByMetier(filtered);
  else if (currentTab === "byProblematique") renderByProblematique(filtered);
}

// ======================
// CRUD CATÉGORIES
// ======================
function handleCategorieClick() {
  if (currentUser.role !== "admin") {
    alert("Accès réservé à l'administrateur.");
    return;
  }
  showCategorieChoiceModal();
}

function showCategorieChoiceModal() { showModal("categorieChoiceModal"); }

function showCategorieModal(mode, id = null) {
  hideModal("categorieChoiceModal");
  hideModal("categorieListModal");

  const modalTitle = document.getElementById("categorieModalTitle");

  if (mode === "add") {
    modalTitle.textContent = "Nouvelle catégorie";
    document.getElementById("categorieNom").value = "";
    document.getElementById("categorieCouleur").value = "#FF9800";
    editingCategorieId = null;
  } else if (mode === "edit" && id) {
    modalTitle.textContent = "Modifier la catégorie";
    const categorie = categories[id];
    document.getElementById("categorieNom").value = categorie.label;
    document.getElementById("categorieCouleur").value = categorie.color;
    editingCategorieId = id;
  }

  showModal("categorieModal");
}

function saveCategorie() {
  const nom = document.getElementById("categorieNom").value.trim();
  const couleur = document.getElementById("categorieCouleur").value;

  if (!nom) {
    alert("Le nom est requis !");
    return;
  }

  const id = editingCategorieId || nom.toLowerCase().replace(/\s+/g, "-");

  if (!editingCategorieId && categories[id]) {
    alert("Une catégorie avec ce nom existe déjà !");
    return;
  }

  categories[id] = { label: nom, icon: "❓", color: couleur };

  if (editingCategorieId && editingCategorieId !== id) {
    problematiques.forEach(p => { if (p.categorie === editingCategorieId) p.categorie = id; });
    delete categories[editingCategorieId];
  }

  localStorage.setItem("categories", JSON.stringify(categories));
  localStorage.setItem("problematiques", JSON.stringify(problematiques));

  hideModal("categorieModal");
  updateCategorieSelect();
  renderProblematiques();
}

function updateCategorieSelect() {
  const select = document.getElementById("problematiqueCategorie");
  if (!select) return;
  select.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "--- Sélectionnez une catégorie ---";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  Object.keys(categories).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = categories[key].label;
    select.appendChild(option);
  });
}

function showCategorieListModal() {
  hideModal("categorieChoiceModal");
  const container = document.getElementById("categorieListContainer");
  container.innerHTML = "";

  Object.keys(categories).forEach(id => {
    const categorie = categories[id];
    const item = document.createElement("div");
    item.className = "categorie-item";
    item.innerHTML = `
      <div style="display:flex;align-items:center;">
        <div class="categorie-color" style="background-color:${categorie.color}"></div>
        <span>${categorie.label}</span>
      </div>
      <div class="categorie-actions">
        <button class="btn secondary" onclick="showCategorieModal('edit','${id}')">Modifier</button>
        <button class="btn danger" onclick="confirmDeleteCategorie('${id}')">Supprimer</button>
      </div>
    `;
    container.appendChild(item);
  });

  showModal("categorieListModal");
}

function confirmDeleteCategorie(id) {
  const count = problematiques.filter(p => p.categorie === id).length;

  if (count > 0) {
    const confirmMsg =
      `Cette catégorie contient ${count} problématique(s).\n` +
      `Supprimer la catégorie supprimera aussi ces problématiques.\n` +
      `Voulez-vous continuer ?`;
    if (!confirm(confirmMsg)) return;

    problematiques = problematiques.filter(p => p.categorie !== id);
    localStorage.setItem("problematiques", JSON.stringify(problematiques));
  }

  delete categories[id];
  localStorage.setItem("categories", JSON.stringify(categories));
  updateCategorieSelect();
  hideModal("categorieListModal");
  updateUI();
}

// ======================
// AFFICHAGE PAR MÉTIER / CATÉGORIE + TOGGLE
// ======================
let expandState = 0; // 0 = tout replié, 1 = en-têtes ouverts, 2 = descriptions visibles

function toggleExpandCollapse() {
  const btn = document.getElementById("expandCollapseBtn");
  expandState = (expandState + 1) % 3;

  document.querySelectorAll(".group-content").forEach(el => {
    el.classList.toggle("open", expandState >= 1);
  });

  document.querySelectorAll(".problematique-preview").forEach(el => {
    el.style.display = expandState === 2 ? "block" : "none";
  });

  if (expandState === 0) btn.textContent = "Déplier";
  else if (expandState === 1) btn.textContent = "+ Déplier";
  else btn.textContent = "Replier";
}

function renderByMetier(list) {
  const container = document.getElementById("metiersList");
  if (!container) return;
  container.innerHTML = "";

  list.sort((a, b) => new Date(b.dateDeb) - new Date(a.dateDeb));

  const grouped = {};
  list.forEach(p => {
    if (!grouped[p.métier]) grouped[p.métier] = [];
    grouped[p.métier].push(p);
  });

  Object.keys(grouped).forEach(key => {
    const data = grouped[key];
    const metier = metiers[key];

    const card = document.createElement("div");
    card.className = "group-card";
    card.style.borderLeftColor = metier.color;

    card.innerHTML = `
      <div class="group-header" onclick="toggleGroup('m-${key}')">
        ${metier.label} <span class="badge">${data.length}</span>
      </div>
      <div class="group-content" id="m-${key}">
        ${data.map(p => {
          const canEdit = currentUser.role === "admin" || p.métier === currentUser.métier;
          return `
            <div class="problematique-item" onclick="togglePreview('metier-${p.id}')" style="border-right:4px solid ${categories[p.categorie].color}">
              <div class="item-header">
                <span class="item-date">${formatDate(p.dateDeb)}</span>
                <strong class="item-title">${p.titre}</strong>
                <span class="item-context">${categories[p.categorie].label}</span>
              </div>
            </div>
            <div class="problematique-preview" id="preview-metier-${p.id}" style="display:none;border:3px solid ${categories[p.categorie].color}" ${canEdit ? `onclick="openProblematique('${p.id}')"` : ""}>
              <div class="preview-content"><p>${p.description}</p></div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    container.appendChild(card);
  });
}

function renderByProblematique(list) {
  const container = document.getElementById("problematiquesGrid");
  if (!container) return;
  container.innerHTML = "";

  list.sort((a, b) => new Date(b.dateDeb) - new Date(a.dateDeb));

  const grouped = {};
  list.forEach(p => {
    if (!grouped[p.categorie]) grouped[p.categorie] = [];
    grouped[p.categorie].push(p);
  });

  Object.keys(grouped).forEach(key => {
    const data = grouped[key];
    const categorie = categories[key];

    const card = document.createElement("div");
    card.className = "group-card";
    card.style.borderLeftColor = categorie.color;

    card.innerHTML = `
      <div class="group-header" onclick="toggleGroup('c-${key}')">
        ${categorie.label} <span class="badge">${data.length}</span>
      </div>
      <div class="group-content" id="c-${key}">
        ${data.map(p => {
          const canEdit = currentUser.role === "admin" || p.métier === currentUser.métier;
          return `
            <div class="problematique-item" onclick="togglePreview('categorie-${p.id}')" style="border-right:4px solid ${metiers[p.métier].color}">
              <div class="item-header">
                <span class="item-date">${formatDate(p.dateDeb)}</span>
                <strong class="item-title">${p.titre}</strong>
                <span class="item-context">${metiers[p.métier].label}</span>
              </div>
            </div>
            <div class="problematique-preview" id="preview-categorie-${p.id}" style="display:none;border:3px solid ${metiers[p.métier].color}" ${canEdit ? `onclick="openProblematique('${p.id}')"` : ""}>
              <div class="preview-content"><p>${p.description}</p></div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    container.appendChild(card);
  });
}

// ======================
// FONCTION DE LIAISON
// ======================
function renderProblematiques() {
  const userProblematiques = getUserProblematiques();
  if (currentTab === "byMetier") renderByMetier(userProblematiques);
  else if (currentTab === "byProblematique") renderByProblematique(userProblematiques);
}

// ======================
// TOGGLE
// ======================
function togglePreview(typeId) {
  const preview = document.getElementById(`preview-${typeId}`);
  if (!preview) return;
  preview.style.display = preview.style.display === "none" ? "block" : "none";
}

function toggleGroup(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("open");
}

// ======================
// INITIALISATION, SPLASH, AUTH, THÈME, ONGLETS
// ======================
document.addEventListener("DOMContentLoaded", () => {
  setupModalClose();
  applyTheme();
  updateCategorieSelect();

  const authScreen   = document.getElementById("authScreen");
  const mainScreen   = document.getElementById("mainScreen");
  const bottomBar    = document.getElementById("bottomBar");
  const splash       = document.getElementById("splashScreen");
  const searchBanner = document.getElementById("searchBanner");
  const searchInput  = document.getElementById("searchInput");
  const searchOverlay= document.getElementById("searchOverlay");

  if (authScreen)  authScreen.style.display  = "none";
  if (mainScreen)  mainScreen.style.display  = "none";
  if (bottomBar)   bottomBar.style.display   = "none";
  if (searchBanner)searchBanner.style.display= "none";
  if (splash)      splash.style.display      = "block";

  setTimeout(() => {
    if (splash) splash.style.display = "none";
    const user = localStorage.getItem("user");
    if (user) setUser(JSON.parse(user));
    else setUser(null);
  }, 1000);

  // ============================
  // 🔍 MODE RECHERCHE
  // ============================
  let isSearchMode = false;

  function enterSearchMode() {
    if (isSearchMode) return;
    isSearchMode = true;
    document.body.classList.add("search-mode");
    searchBanner?.classList.add("search-bar-top");
    if (searchOverlay) searchOverlay.style.display = "none"; // overlay neutralisé
  }

  function exitSearchMode() {
    if (!isSearchMode) return;
    isSearchMode = false;
    document.body.classList.remove("search-mode");
    searchBanner?.classList.remove("search-bar-top");
    searchInput?.blur();
    searchProblematiques();
  }

  searchInput?.addEventListener("focus", enterSearchMode);
  searchInput?.addEventListener("input", searchProblematiques);

  searchBanner?.addEventListener("click", (e) => e.stopPropagation(), true);
  searchBanner?.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });

  searchInput?.addEventListener("touchend", () => {
    if (document.activeElement !== searchInput) { searchInput.focus(); enterSearchMode(); }
  }, { passive: true });

  let ignoreOutsideUntil = 0;

if (searchInput) {
  searchInput.addEventListener("focus", () => {
    // Pendant l’ouverture du clavier, iOS peut déclencher des events parasites
    ignoreOutsideUntil = Date.now() + 400; // 0.4s ≈ durée anim clavier
  });
}

// Utilise pointerdown (plus fiable mobile) + ignore pendant l’anim
document.addEventListener("pointerdown", (e) => {
  if (!isSearchMode) return;
  if (Date.now() < ignoreOutsideUntil) return; // évite le blur immédiat
  if (e.target.closest("#searchBanner")) return;
  exitSearchMode();
}, true);

let resizeTimer = null;

window.addEventListener("resize", () => {
  if (!isSearchMode) return;

  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // On ne sort du mode recherche QUE si l'input n'est plus focus après l’anim
    if (document.activeElement !== searchInput) exitSearchMode();
  }, 250); // attend que le clavier ait fini sa transition
});
});
// ======================
// AUTHENTIFICATION
// ======================
function authenticate() {
  const code = document.getElementById("userCode").value.trim();
  if (codesValides[code]) setUser(codesValides[code]);
  else alert("Code invalide !");
}

// ======================
// DÉCONNEXION & RESET
// ======================
function logout() {
  hideModal("moreModal");
  setUser(null);
  const input = document.getElementById("userCode");
  if (input) input.value = "";
}

function resetData() {
  if (!confirm("Êtes-vous sûr de vouloir réinitialiser TOUTES les données ? Cette action est irréversible.")) return;

  localStorage.clear();

  problematiques = [];
  categories = {
    catégorie1: { label: "Planning",  icon: "", color: "#FF9800" },
    catégorie2: { label: "Entretien", icon: "", color: "#00BCD4" },
  };
  currentUser = null;
  currentTheme = "dark";

  const auth = document.getElementById("authScreen");
  const main = document.getElementById("mainScreen");
  const bar  = document.getElementById("bottomBar");
  const search = document.getElementById("searchBanner");

  if (auth) auth.style.display = "flex";
  if (main) main.style.display = "none";
  if (bar)  bar.style.display  = "none";
  if (search) search.style.display = "none";

  updateUI();
  hideModal("moreModal");
}

// ======================
// THÈME
// ======================
function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", currentTheme);
  applyTheme();
}
function applyTheme() { document.documentElement.setAttribute("data-theme", currentTheme); }

// ======================
// ONGLET
// ======================
function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

  const tab = document.getElementById(tabId);
  if (tab) tab.style.display = "block";

  const btn = document.querySelector(`[onclick="showTab('${tabId}')"]`);
  if (btn) btn.classList.add("active");

  currentTab = tabId;

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";

  renderProblematiques();
}

function showMoreModal() { showModal("moreModal"); }
