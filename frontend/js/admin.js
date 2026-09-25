/* =========================================================
   CONFIG
   ========================================================= */
const API_BASE = "/api";
const TOKEN_KEY = "denise_admin_token";

const STATUS_LABEL = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

/* =========================================================
   ELEMENTOS
   ========================================================= */
const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const adminApp = document.getElementById("adminApp");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");

const projectsTableBody = document.getElementById("projectsTableBody");
const messagesTableBody = document.getElementById("messagesTableBody");
const newProjectBtn = document.getElementById("newProjectBtn");

const projectModal = document.getElementById("projectModal");
const projectForm = document.getElementById("projectForm");
const modalTitle = document.getElementById("modalTitle");
const modalClose = document.getElementById("modalClose");
const cancelBtn = document.getElementById("cancelBtn");
const deleteProjectBtn = document.getElementById("deleteProjectBtn");
const projectFormError = document.getElementById("projectFormError");

const imagesFieldWrap = document.getElementById("imagesFieldWrap");
const imageGallery = document.getElementById("imageGallery");
const imageUploadInput = document.getElementById("imageUploadInput");

const booksTableBody = document.getElementById("booksTableBody");
const newBookBtn = document.getElementById("newBookBtn");

const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("bookForm");
const bookModalTitle = document.getElementById("bookModalTitle");
const bookModalClose = document.getElementById("bookModalClose");
const bookCancelBtn = document.getElementById("bookCancelBtn");
const deleteBookBtn = document.getElementById("deleteBookBtn");
const bookFormError = document.getElementById("bookFormError");

const bookCoverFieldWrap = document.getElementById("bookCoverFieldWrap");
const bookCoverPreview = document.getElementById("bookCoverPreview");
const bookCoverInput = document.getElementById("bookCoverInput");

const aboutImageForm = document.getElementById("aboutImageForm");
const aboutImageInput = document.getElementById("aboutImageInput");
const aboutImageCaption = document.getElementById("aboutImageCaption");
const aboutImageAlt = document.getElementById("aboutImageAlt");
const aboutImageOrder = document.getElementById("aboutImageOrder");
const aboutImagesGrid = document.getElementById("aboutImagesGrid");
const aboutCropStatus = document.getElementById("aboutCropStatus");
const imageCropModal = document.getElementById("imageCropModal");
const cropCanvas = document.getElementById("cropCanvas");
const cropStage = document.getElementById("cropStage");
const cropZoom = document.getElementById("cropZoom");
const cropModalClose = document.getElementById("cropModalClose");
const cropCancelBtn = document.getElementById("cropCancelBtn");
const cropConfirmBtn = document.getElementById("cropConfirmBtn");

const careerTimelineEditor = document.getElementById("careerTimelineEditor");
const addTimelineItemBtn = document.getElementById("addTimelineItemBtn");
const saveCareerBtn = document.getElementById("saveCareerBtn");
const careerFormError = document.getElementById("careerFormError");

/* =========================================================
   AUTH HELPERS
   ========================================================= */
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return res;
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 3200);
}

/* =========================================================
   LOGIN / LOGOUT
   ========================================================= */
function showLogin() {
  loginScreen.hidden = false;
  adminApp.hidden = true;
}

function showApp() {
  loginScreen.hidden = true;
  adminApp.hidden = false;
  loadProjects();
  loadBooks();
  loadPublications();
  loadProducts();
  loadAboutImages();
  loadCareer();
  loadMessages();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Usuário ou senha inválidos");
    }
    const data = await res.json();
    setToken(data.access_token);
    showApp();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.hidden = false;
  }
});

logoutBtn.addEventListener("click", () => {
  clearToken();
  showLogin();
});

async function checkSession() {
  const token = getToken();
  if (!token) {
    showLogin();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Sessão inválida");
    showApp();
  } catch {
    clearToken();
    showLogin();
  }
}
checkSession();

/* =========================================================
   NAVEGAÇÃO ENTRE ABAS
   ========================================================= */
document.querySelectorAll(".nav-item[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item[data-tab]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById("tabProjects").hidden = tab !== "projects";
    document.getElementById("tabBooks").hidden = tab !== "books";
    document.getElementById("tabPublications").hidden = tab !== "publications";
    document.getElementById("tabProducts").hidden = tab !== "products";
    document.getElementById("tabAbout").hidden = tab !== "about";
    document.getElementById("tabCareer").hidden = tab !== "career";
    document.getElementById("tabMessages").hidden = tab !== "messages";
  });
});

/* =========================================================
   PROJETOS: LISTAR
   ========================================================= */
let currentProjects = [];

async function loadProjects() {
  projectsTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Carregando...</td></tr>`;
  try {
    const res = await apiFetch("/projects");
    const projects = await res.json();
    currentProjects = projects;
    renderProjectsTable(projects);
  } catch (err) {
    projectsTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">${err.message}</td></tr>`;
  }
}

function renderProjectsTable(projects) {
  if (!projects.length) {
    projectsTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Nenhum projeto cadastrado ainda. Clique em "Novo projeto".</td></tr>`;
    return;
  }

  projectsTableBody.innerHTML = projects
    .map((p) => {
      const cover = p.images && p.images.length ? p.images[0].image_path : null;
      const thumb = cover
        ? `<img class="thumb" src="${cover}" alt="">`
        : `<div class="thumb-placeholder"><i class="ph ph-image"></i></div>`;

      return `
        <tr data-id="${p.id}">
          <td>${thumb}</td>
          <td><strong>${escapeHTML(p.title)}</strong></td>
          <td>${escapeHTML(p.category || "—")}</td>
          <td><span class="badge ${p.status}">${STATUS_LABEL[p.status] || p.status}</span></td>
          <td><span class="badge ${p.featured ? "featured-yes" : "featured-no"}">${p.featured ? "Sim" : "Não"}</span></td>
          <td>
            <div class="row-actions">
              <button class="icon-btn edit-btn" title="Editar"><i class="ph ph-pencil-simple"></i></button>
              <button class="icon-btn danger delete-btn" title="Excluir"><i class="ph ph-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  projectsTableBody.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      const project = currentProjects.find((p) => p.id === id);
      openModal(project);
    });
  });
  projectsTableBody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      const project = currentProjects.find((p) => p.id === id);
      confirmDelete(project);
    });
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* =========================================================
   MODAL: ABRIR / FECHAR
   ========================================================= */
let editingProject = null;

function openModal(project = null) {
  editingProject = project;
  projectForm.reset();
  projectFormError.hidden = true;

  if (project) {
    modalTitle.textContent = "Editar projeto";
    document.getElementById("projectId").value = project.id;
    document.getElementById("fieldTitle").value = project.title;
    document.getElementById("fieldDescription").value = project.description;
    document.getElementById("fieldCategory").value = project.category || "";
    document.getElementById("fieldDate").value = project.project_date || "";
    document.getElementById("fieldTech").value = project.tech_stack || "";
    document.getElementById("fieldRepo").value = project.repo_url || "";
    document.getElementById("fieldDemo").value = project.demo_url || "";
    document.getElementById("fieldStatus").value = project.status;
    document.getElementById("fieldFeatured").checked = project.featured;

    deleteProjectBtn.hidden = false;
  } else {
    modalTitle.textContent = "Novo projeto";
    document.getElementById("projectId").value = "";
    deleteProjectBtn.hidden = true;
    imagesFieldWrap.hidden = true;
  }

  projectModal.hidden = false;
}

function closeModal() {
  projectModal.hidden = true;
  editingProject = null;
}

newProjectBtn.addEventListener("click", () => openModal(null));
modalClose.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
projectModal.addEventListener("click", (e) => {
  if (e.target === projectModal) closeModal();
});

/* =========================================================
   PROJETOS: CRIAR / EDITAR
   ========================================================= */
projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  projectFormError.hidden = true;

  const payload = {
    title: document.getElementById("fieldTitle").value.trim(),
    description: document.getElementById("fieldDescription").value.trim(),
    category: document.getElementById("fieldCategory").value.trim() || null,
    project_date: document.getElementById("fieldDate").value.trim() || null,
    tech_stack: document.getElementById("fieldTech").value.trim(),
    repo_url: document.getElementById("fieldRepo").value.trim() || null,
    demo_url: document.getElementById("fieldDemo").value.trim() || null,
    status: document.getElementById("fieldStatus").value,
    featured: document.getElementById("fieldFeatured").checked,
  };

  const id = document.getElementById("projectId").value;
  const isEdit = Boolean(id);

  try {
    const res = await apiFetch(isEdit ? `/projects/${id}` : "/projects", {
      method: isEdit ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao salvar projeto");
    }
    const saved = await res.json();
    showToast(isEdit ? "Projeto atualizado!" : "Projeto criado!");

    if (!isEdit) {
      // Reabre o modal já em modo edição para permitir upload de imagens
      closeModal();
    } else {
      closeModal();
    }
    loadProjects();
  } catch (err) {
    projectFormError.textContent = err.message;
    projectFormError.hidden = false;
  }
});

/* =========================================================
   PROJETOS: EXCLUIR
   ========================================================= */
function confirmDelete(project) {
  if (!confirm(`Excluir o projeto "${project.title}"? Essa ação não pode ser desfeita.`)) return;
  deleteProject(project.id);
}

deleteProjectBtn.addEventListener("click", () => {
  if (!editingProject) return;
  if (!confirm(`Excluir o projeto "${editingProject.title}"? Essa ação não pode ser desfeita.`)) return;
  deleteProject(editingProject.id);
});

async function deleteProject(id) {
  try {
    const res = await apiFetch(`/projects/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok && res.status !== 204) throw new Error("Erro ao excluir projeto");
    showToast("Projeto excluído.");
    closeModal();
    loadProjects();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* =========================================================
   IMAGENS DO PROJETO
   ========================================================= */
function renderImageGallery(images) {
  if (!images.length) {
    imageGallery.innerHTML = `<p class="hint">Nenhuma imagem ainda.</p>`;
    return;
  }
  imageGallery.innerHTML = images
    .map(
      (img) => `
        <div class="img-item" data-image-id="${img.id}">
          <img src="${img.image_path}" alt="">
          <button type="button" class="remove-image-btn" title="Remover"><i class="ph ph-x"></i></button>
        </div>
      `
    )
    .join("");

  imageGallery.querySelectorAll(".remove-image-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const wrapper = e.target.closest(".img-item");
      const imageId = wrapper.dataset.imageId;
      if (!editingProject) return;
      try {
        const res = await apiFetch(`/projects/${editingProject.id}/images/${imageId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!res.ok && res.status !== 204) throw new Error("Erro ao remover imagem");
        wrapper.remove();
        showToast("Imagem removida.");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });
}

imageUploadInput.addEventListener("change", async () => {
  if (!editingProject || !imageUploadInput.files.length) return;
  const file = imageUploadInput.files[0];
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await apiFetch(`/projects/${editingProject.id}/images?order=0`, {
      method: "POST",
      headers: authHeaders(), // não define Content-Type: o browser define o boundary do multipart
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao enviar imagem");
    }
    const image = await res.json();
    editingProject.images = [...(editingProject.images || []), image];
    renderImageGallery(editingProject.images);
    showToast("Imagem adicionada!");
    imageUploadInput.value = "";
    loadProjects();
  } catch (err) {
    showToast(err.message, "error");
  }
});

/* =========================================================
   LIVROS: LISTAR
   ========================================================= */
let currentBooks = [];

async function loadBooks() {
  booksTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Carregando...</td></tr>`;
  try {
    const res = await apiFetch("/books");
    const books = await res.json();
    currentBooks = books;
    renderBooksTable(books);
  } catch (err) {
    booksTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">${err.message}</td></tr>`;
  }
}

function renderBooksTable(books) {
  if (!books.length) {
    booksTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Nenhum livro cadastrado ainda. Clique em "Novo livro".</td></tr>`;
    return;
  }

  booksTableBody.innerHTML = books
    .map((b) => {
      const thumb = b.cover_image
        ? `<img class="thumb" src="${b.cover_image}" alt="">`
        : `<div class="thumb-placeholder"><i class="ph ph-book"></i></div>`;

      return `
        <tr data-id="${b.id}">
          <td>${thumb}</td>
          <td><strong>${escapeHTML(b.title)}</strong></td>
          <td>${escapeHTML(b.year || "—")}</td>
          <td>${escapeHTML(b.publisher || "—")}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn edit-book-btn" title="Editar"><i class="ph ph-pencil-simple"></i></button>
              <button class="icon-btn danger delete-book-btn" title="Excluir"><i class="ph ph-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  booksTableBody.querySelectorAll(".edit-book-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      const book = currentBooks.find((b) => b.id === id);
      openBookModal(book);
    });
  });
  booksTableBody.querySelectorAll(".delete-book-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      const book = currentBooks.find((b) => b.id === id);
      confirmDeleteBook(book);
    });
  });
}

/* =========================================================
   LIVROS: MODAL ABRIR / FECHAR
   ========================================================= */
let editingBook = null;

function openBookModal(book = null) {
  editingBook = book;
  bookForm.reset();
  bookFormError.hidden = true;

  if (book) {
    bookModalTitle.textContent = "Editar livro";
    document.getElementById("bookId").value = book.id;
    document.getElementById("bookFieldTitle").value = book.title;
    document.getElementById("bookFieldDescription").value = book.description;
    document.getElementById("bookFieldYear").value = book.year || "";
    document.getElementById("bookFieldPublisher").value = book.publisher || "";
    document.getElementById("bookFieldUrl").value = book.external_url || "";

    deleteBookBtn.hidden = false;
    renderBookCoverPreview(book.cover_image);
  } else {
    bookModalTitle.textContent = "Novo livro";
    document.getElementById("bookId").value = "";
    deleteBookBtn.hidden = true;
    renderBookCoverPreview(null);
  }

  bookModal.hidden = false;
}

function closeBookModal() {
  bookModal.hidden = true;
  editingBook = null;
}

newBookBtn.addEventListener("click", () => openBookModal(null));
bookModalClose.addEventListener("click", closeBookModal);
bookCancelBtn.addEventListener("click", closeBookModal);
bookModal.addEventListener("click", (e) => {
  if (e.target === bookModal) closeBookModal();
});

/* =========================================================
   LIVROS: CRIAR / EDITAR
   ========================================================= */
bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  bookFormError.hidden = true;

  const payload = {
    title: document.getElementById("bookFieldTitle").value.trim(),
    description: document.getElementById("bookFieldDescription").value.trim(),
    year: document.getElementById("bookFieldYear").value.trim() || null,
    publisher: document.getElementById("bookFieldPublisher").value.trim() || null,
    external_url: document.getElementById("bookFieldUrl").value.trim() || null,
  };

  const id = document.getElementById("bookId").value;
  const isEdit = Boolean(id);

  try {
    const res = await apiFetch(isEdit ? `/books/${id}` : "/books", {
      method: isEdit ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao salvar livro");
    }
    let saved = await res.json();
    const pendingCover = bookCoverInput.files[0];
    if (pendingCover && (!isEdit || saved.cover_image !== editingBook?.cover_image)) {
      saved = await uploadBookCover(saved.id, pendingCover);
    }
    showToast(isEdit ? "Livro atualizado!" : "Livro criado com sucesso!");
    closeBookModal();
    loadBooks();
  } catch (err) {
    bookFormError.textContent = err.message;
    bookFormError.hidden = false;
  }
});

/* =========================================================
   LIVROS: EXCLUIR
   ========================================================= */
function confirmDeleteBook(book) {
  if (!confirm(`Excluir o livro "${book.title}"? Essa ação não pode ser desfeita.`)) return;
  deleteBook(book.id);
}

deleteBookBtn.addEventListener("click", () => {
  if (!editingBook) return;
  if (!confirm(`Excluir o livro "${editingBook.title}"? Essa ação não pode ser desfeita.`)) return;
  deleteBook(editingBook.id);
});

async function deleteBook(id) {
  try {
    const res = await apiFetch(`/books/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok && res.status !== 204) throw new Error("Erro ao excluir livro");
    showToast("Livro excluído.");
    closeBookModal();
    loadBooks();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* =========================================================
   LIVROS: CAPA
   ========================================================= */
function renderBookCoverPreview(coverImage) {
  if (!coverImage) {
    bookCoverPreview.innerHTML = `<p class="hint">Nenhuma capa ainda.</p>`;
    return;
  }
  bookCoverPreview.innerHTML = `
    <div class="img-item">
      <img src="${coverImage}" alt="">
      ${editingBook ? '<button type="button" class="remove-book-cover" title="Remover capa"><i class="ph ph-x"></i></button>' : ""}
    </div>
  `;
}

bookCoverInput.addEventListener("change", async () => {
  if (!bookCoverInput.files.length) return;
  const file = bookCoverInput.files[0];
  if (!editingBook) {
    renderBookCoverPreview(URL.createObjectURL(file));
    return;
  }

  try {
    const updated = await uploadBookCover(editingBook.id, file);
    editingBook.cover_image = updated.cover_image;
    renderBookCoverPreview(updated.cover_image);
    showToast("Capa atualizada!");
    bookCoverInput.value = "";
    loadBooks();
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function uploadBookCover(bookId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch(`/books/${bookId}/cover`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Erro ao enviar capa");
  }
  return res.json();
}

bookCoverPreview.addEventListener("click", async (event) => {
  const button = event.target.closest(".remove-book-cover");
  if (!button || !editingBook) return;
  try {
    const res = await apiFetch(`/books/${editingBook.id}/cover`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Erro ao remover capa");
    editingBook.cover_image = null;
    renderBookCoverPreview(null);
    loadBooks();
    showToast("Capa removida.");
  } catch (err) {
    showToast(err.message, "error");
  }
});

/* =========================================================
   PUBLICAÇÕES: LISTAR
   ========================================================= */
const publicationsTableBody = document.getElementById("publicationsTableBody");
const newPublicationBtn = document.getElementById("newPublicationBtn");
const publicationModal = document.getElementById("publicationModal");
const publicationForm = document.getElementById("publicationForm");
const publicationModalTitle = document.getElementById("publicationModalTitle");
const publicationModalClose = document.getElementById("publicationModalClose");
const publicationCancelBtn = document.getElementById("publicationCancelBtn");
const deletePublicationBtn = document.getElementById("deletePublicationBtn");
const publicationFormError = document.getElementById("publicationFormError");

let currentPublications = [];
let editingPublication = null;

async function loadPublications() {
  publicationsTableBody.innerHTML = `<tr><td colspan="4" class="empty-row">Carregando...</td></tr>`;
  try {
    const res = await apiFetch("/publications");
    currentPublications = await res.json();
    renderPublicationsTable();
  } catch (err) {
    publicationsTableBody.innerHTML = `<tr><td colspan="4" class="empty-row">${err.message}</td></tr>`;
  }
}

function renderPublicationsTable() {
  if (!currentPublications.length) {
    publicationsTableBody.innerHTML = `<tr><td colspan="4" class="empty-row">Nenhuma publicação cadastrada ainda. Clique em "Nova publicação".</td></tr>`;
    return;
  }
  publicationsTableBody.innerHTML = currentPublications.map((p) => `
    <tr data-id="${p.id}">
      <td><strong>${escapeHTML(p.title)}</strong></td>
      <td>${escapeHTML(p.category || "—")}</td>
      <td><span class="badge ${p.featured ? "featured-yes" : "featured-no"}">${p.featured ? "Sim" : "Não"}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn edit-publication-btn" title="Editar"><i class="ph ph-pencil-simple"></i></button>
          <button class="icon-btn danger delete-publication-btn" title="Excluir"><i class="ph ph-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");

  publicationsTableBody.querySelectorAll(".edit-publication-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      openPublicationModal(currentPublications.find((p) => p.id === id));
    });
  });
  publicationsTableBody.querySelectorAll(".delete-publication-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      const publication = currentPublications.find((p) => p.id === id);
      if (!confirm(`Excluir a publicação "${publication.title}"? Essa ação não pode ser desfeita.`)) return;
      deletePublication(publication.id);
    });
  });
}

function openPublicationModal(publication = null) {
  editingPublication = publication;
  publicationForm.reset();
  publicationFormError.hidden = true;

  if (publication) {
    publicationModalTitle.textContent = "Editar publicação";
    document.getElementById("publicationId").value = publication.id;
    document.getElementById("publicationFieldTitle").value = publication.title;
    document.getElementById("publicationFieldKicker").value = publication.kicker || "";
    document.getElementById("publicationFieldCategory").value = publication.category || "";
    document.getElementById("publicationFieldUrl").value = publication.external_url || "";
    document.getElementById("publicationFieldFeatured").checked = publication.featured;
    deletePublicationBtn.hidden = false;
  } else {
    publicationModalTitle.textContent = "Nova publicação";
    document.getElementById("publicationId").value = "";
    deletePublicationBtn.hidden = true;
  }
  publicationModal.hidden = false;
}

function closePublicationModal() {
  publicationModal.hidden = true;
  editingPublication = null;
}

newPublicationBtn.addEventListener("click", () => openPublicationModal(null));
publicationModalClose.addEventListener("click", closePublicationModal);
publicationCancelBtn.addEventListener("click", closePublicationModal);
publicationModal.addEventListener("click", (e) => { if (e.target === publicationModal) closePublicationModal(); });

publicationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  publicationFormError.hidden = true;

  const payload = {
    title: document.getElementById("publicationFieldTitle").value.trim(),
    kicker: document.getElementById("publicationFieldKicker").value.trim() || null,
    category: document.getElementById("publicationFieldCategory").value.trim() || null,
    external_url: document.getElementById("publicationFieldUrl").value.trim() || null,
    featured: document.getElementById("publicationFieldFeatured").checked,
  };

  const id = document.getElementById("publicationId").value;
  const isEdit = Boolean(id);

  try {
    const res = await apiFetch(isEdit ? `/publications/${id}` : "/publications", {
      method: isEdit ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao salvar publicação");
    }
    showToast(isEdit ? "Publicação atualizada!" : "Publicação criada!");
    closePublicationModal();
    loadPublications();
  } catch (err) {
    publicationFormError.textContent = err.message;
    publicationFormError.hidden = false;
  }
});

deletePublicationBtn.addEventListener("click", () => {
  if (!editingPublication) return;
  if (!confirm(`Excluir a publicação "${editingPublication.title}"? Essa ação não pode ser desfeita.`)) return;
  deletePublication(editingPublication.id);
});

async function deletePublication(id) {
  try {
    const res = await apiFetch(`/publications/${id}`, { method: "DELETE", headers: authHeaders() });
    if (!res.ok && res.status !== 204) throw new Error("Erro ao excluir publicação");
    showToast("Publicação excluída.");
    closePublicationModal();
    loadPublications();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* =========================================================
   PRODUTOS EDUCACIONAIS: LISTAR
   ========================================================= */
const productsTableBody = document.getElementById("productsTableBody");
const newProductBtn = document.getElementById("newProductBtn");
const productModal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");
const productModalTitle = document.getElementById("productModalTitle");
const productModalClose = document.getElementById("productModalClose");
const productCancelBtn = document.getElementById("productCancelBtn");
const deleteProductBtn = document.getElementById("deleteProductBtn");
const productFormError = document.getElementById("productFormError");

let currentProducts = [];
let editingProduct = null;

async function loadProducts() {
  productsTableBody.innerHTML = `<tr><td colspan="3" class="empty-row">Carregando...</td></tr>`;
  try {
    const res = await apiFetch("/products");
    currentProducts = await res.json();
    renderProductsTable();
  } catch (err) {
    productsTableBody.innerHTML = `<tr><td colspan="3" class="empty-row">${err.message}</td></tr>`;
  }
}

function renderProductsTable() {
  if (!currentProducts.length) {
    productsTableBody.innerHTML = `<tr><td colspan="3" class="empty-row">Nenhum produto cadastrado ainda. Clique em "Novo produto".</td></tr>`;
    return;
  }
  productsTableBody.innerHTML = currentProducts.map((p) => `
    <tr data-id="${p.id}">
      <td><strong>${escapeHTML(p.title)}</strong></td>
      <td>${escapeHTML(p.category || "—")}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn edit-product-btn" title="Editar"><i class="ph ph-pencil-simple"></i></button>
          <button class="icon-btn danger delete-product-btn" title="Excluir"><i class="ph ph-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");

  productsTableBody.querySelectorAll(".edit-product-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      openProductModal(currentProducts.find((p) => p.id === id));
    });
  });
  productsTableBody.querySelectorAll(".delete-product-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.closest("tr").dataset.id);
      const product = currentProducts.find((p) => p.id === id);
      if (!confirm(`Excluir o produto "${product.title}"? Essa ação não pode ser desfeita.`)) return;
      deleteProduct(product.id);
    });
  });
}

function openProductModal(product = null) {
  editingProduct = product;
  productForm.reset();
  productFormError.hidden = true;

  if (product) {
    productModalTitle.textContent = "Editar produto";
    document.getElementById("productId").value = product.id;
    document.getElementById("productFieldTitle").value = product.title;
    document.getElementById("productFieldKicker").value = product.kicker || "";
    document.getElementById("productFieldCategory").value = product.category || "";
    document.getElementById("productFieldUrl").value = product.external_url || "";
    deleteProductBtn.hidden = false;
  } else {
    productModalTitle.textContent = "Novo produto";
    document.getElementById("productId").value = "";
    deleteProductBtn.hidden = true;
  }
  productModal.hidden = false;
}

function closeProductModal() {
  productModal.hidden = true;
  editingProduct = null;
}

newProductBtn.addEventListener("click", () => openProductModal(null));
productModalClose.addEventListener("click", closeProductModal);
productCancelBtn.addEventListener("click", closeProductModal);
productModal.addEventListener("click", (e) => { if (e.target === productModal) closeProductModal(); });

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  productFormError.hidden = true;

  const payload = {
    title: document.getElementById("productFieldTitle").value.trim(),
    kicker: document.getElementById("productFieldKicker").value.trim() || null,
    category: document.getElementById("productFieldCategory").value.trim() || null,
    external_url: document.getElementById("productFieldUrl").value.trim() || null,
  };

  const id = document.getElementById("productId").value;
  const isEdit = Boolean(id);

  try {
    const res = await apiFetch(isEdit ? `/products/${id}` : "/products", {
      method: isEdit ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao salvar produto");
    }
    showToast(isEdit ? "Produto atualizado!" : "Produto criado!");
    closeProductModal();
    loadProducts();
  } catch (err) {
    productFormError.textContent = err.message;
    productFormError.hidden = false;
  }
});

deleteProductBtn.addEventListener("click", () => {
  if (!editingProduct) return;
  if (!confirm(`Excluir o produto "${editingProduct.title}"? Essa ação não pode ser desfeita.`)) return;
  deleteProduct(editingProduct.id);
});

async function deleteProduct(id) {
  try {
    const res = await apiFetch(`/products/${id}`, { method: "DELETE", headers: authHeaders() });
    if (!res.ok && res.status !== 204) throw new Error("Erro ao excluir produto");
    showToast("Produto excluído.");
    closeProductModal();
    loadProducts();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* =========================================================
   IMAGENS DA SEÇÃO SOBRE MIM
   ========================================================= */
let currentAboutImages = [];
let croppedAboutFile = null;
let cropSourceImage = null;
let cropSourceName = "imagem";
let cropBaseScale = 1;
let cropZoomValue = 1;
let cropOffsetX = 0;
let cropOffsetY = 0;
let cropDragging = false;
let cropPointerX = 0;
let cropPointerY = 0;
let draggedAboutCard = null;

async function loadAboutImages() {
  aboutImagesGrid.innerHTML = '<p class="empty-row">Carregando...</p>';
  try {
    const res = await apiFetch("/about-images");
    if (!res.ok) throw new Error("Erro ao carregar imagens");
    currentAboutImages = await res.json();
    renderAboutImages();
  } catch (err) {
    aboutImagesGrid.innerHTML = `<p class="empty-row">${escapeHTML(err.message)}</p>`;
  }
}

function renderAboutImages() {
  if (!currentAboutImages.length) {
    aboutImagesGrid.innerHTML = '<p class="empty-row about-empty">Nenhuma imagem cadastrada. Adicione a primeira acima.</p>';
    return;
  }

  aboutImagesGrid.innerHTML = currentAboutImages.map((image) => `
    <article class="about-admin-card" data-id="${image.id}">
      <button class="about-drag-handle" type="button" draggable="true" aria-label="Arrastar para mudar a ordem" title="Arraste para mudar a ordem">
        <i class="ph ph-dots-six-vertical"></i>
      </button>
      <img src="${image.image_path}" alt="${escapeHTML(image.alt_text || image.caption || "")}">
      <div class="about-card-fields">
        <div class="field">
          <label>Legenda</label>
          <input class="about-caption-input" type="text" maxlength="250" value="${escapeHTML(image.caption || "")}">
        </div>
        <div class="field">
          <label>Texto alternativo</label>
          <input class="about-alt-input" type="text" maxlength="250" value="${escapeHTML(image.alt_text || "")}">
        </div>
        <div class="field">
          <label>Ordem</label>
          <input class="about-order-input" type="number" min="0" value="${image.order}">
        </div>
        <div class="about-card-actions">
          <button class="btn-outline save-about-image" type="button">Salvar</button>
          <button class="btn-outline danger-button delete-about-image" type="button">Excluir</button>
        </div>
      </div>
    </article>
  `).join("");
}

function drawCropPreview() {
  if (!cropSourceImage || !cropCanvas) return;
  const context = cropCanvas.getContext("2d");
  const canvasWidth = cropCanvas.width;
  const canvasHeight = cropCanvas.height;
  const scale = cropBaseScale * cropZoomValue;
  const drawWidth = cropSourceImage.naturalWidth * scale;
  const drawHeight = cropSourceImage.naturalHeight * scale;
  const maxOffsetX = Math.max(0, (drawWidth - canvasWidth) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - canvasHeight) / 2);

  cropOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, cropOffsetX));
  cropOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, cropOffsetY));

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#f4edf4";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(
    cropSourceImage,
    (canvasWidth - drawWidth) / 2 + cropOffsetX,
    (canvasHeight - drawHeight) / 2 + cropOffsetY,
    drawWidth,
    drawHeight
  );
}

function closeCropModal({ discard = false } = {}) {
  imageCropModal.hidden = true;
  cropDragging = false;
  if (discard) {
    croppedAboutFile = null;
    aboutImageInput.value = "";
    aboutCropStatus.textContent = "Selecione uma imagem para recortar.";
    aboutCropStatus.classList.remove("ready");
  }
}

aboutImageInput.addEventListener("change", () => {
  const file = aboutImageInput.files[0];
  if (!file) return;

  const sourceUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(sourceUrl);
    cropSourceImage = image;
    cropSourceName = file.name.replace(/\.[^.]+$/, "") || "imagem";
    cropBaseScale = Math.max(cropCanvas.width / image.naturalWidth, cropCanvas.height / image.naturalHeight);
    cropZoomValue = 1;
    cropOffsetX = 0;
    cropOffsetY = 0;
    cropZoom.value = "1";
    drawCropPreview();
    imageCropModal.hidden = false;
  };
  image.onerror = () => {
    URL.revokeObjectURL(sourceUrl);
    aboutImageInput.value = "";
    showToast("Não foi possível abrir esta imagem.", "error");
  };
  image.src = sourceUrl;
});

cropZoom.addEventListener("input", () => {
  cropZoomValue = Number(cropZoom.value || 1);
  drawCropPreview();
});

cropStage.addEventListener("pointerdown", (event) => {
  if (!cropSourceImage) return;
  cropDragging = true;
  cropPointerX = event.clientX;
  cropPointerY = event.clientY;
  cropStage.setPointerCapture(event.pointerId);
  cropStage.classList.add("is-dragging");
});

cropStage.addEventListener("pointermove", (event) => {
  if (!cropDragging) return;
  const rect = cropCanvas.getBoundingClientRect();
  const scaleX = cropCanvas.width / rect.width;
  const scaleY = cropCanvas.height / rect.height;
  cropOffsetX += (event.clientX - cropPointerX) * scaleX;
  cropOffsetY += (event.clientY - cropPointerY) * scaleY;
  cropPointerX = event.clientX;
  cropPointerY = event.clientY;
  drawCropPreview();
});

function finishCropDrag(event) {
  if (!cropDragging) return;
  cropDragging = false;
  cropStage.classList.remove("is-dragging");
  if (cropStage.hasPointerCapture(event.pointerId)) cropStage.releasePointerCapture(event.pointerId);
}

cropStage.addEventListener("pointerup", finishCropDrag);
cropStage.addEventListener("pointercancel", finishCropDrag);
cropModalClose.addEventListener("click", () => closeCropModal({ discard: true }));
cropCancelBtn.addEventListener("click", () => closeCropModal({ discard: true }));

cropConfirmBtn.addEventListener("click", () => {
  cropCanvas.toBlob((blob) => {
    if (!blob) {
      showToast("Não foi possível recortar esta imagem.", "error");
      return;
    }
    croppedAboutFile = new File([blob], `${cropSourceName}-recorte.jpg`, { type: "image/jpeg" });
    aboutCropStatus.textContent = "Recorte pronto. A imagem será enviada como aparece acima.";
    aboutCropStatus.classList.add("ready");
    closeCropModal();
  }, "image/jpeg", 0.92);
});

aboutImageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedFile = croppedAboutFile || aboutImageInput.files[0];
  if (!selectedFile) return;

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("caption", aboutImageCaption.value.trim());
  formData.append("alt_text", aboutImageAlt.value.trim());
  formData.append("order", aboutImageOrder.value || "0");

  try {
    const res = await apiFetch("/about-images", { method: "POST", headers: authHeaders(), body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao enviar imagem");
    }
    aboutImageForm.reset();
    aboutImageOrder.value = "0";
    croppedAboutFile = null;
    aboutCropStatus.textContent = "Selecione uma imagem para recortar.";
    aboutCropStatus.classList.remove("ready");
    showToast("Imagem adicionada em Sobre mim!");
    loadAboutImages();
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function saveAboutCard(card, { quiet = false } = {}) {
  const imageId = card.dataset.id;
  const payload = {
    caption: card.querySelector(".about-caption-input").value.trim() || null,
    alt_text: card.querySelector(".about-alt-input").value.trim() || null,
    order: Number(card.querySelector(".about-order-input").value || 0),
  };
  const res = await apiFetch(`/about-images/${imageId}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Erro ao salvar imagem");
  if (!quiet) showToast("Imagem atualizada!");
}

aboutImagesGrid.addEventListener("click", async (event) => {
  const card = event.target.closest(".about-admin-card");
  if (!card) return;
  const imageId = card.dataset.id;

  if (event.target.closest(".save-about-image")) {
    try {
      await saveAboutCard(card);
      loadAboutImages();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (event.target.closest(".delete-about-image")) {
    if (!confirm("Excluir esta imagem da seção Sobre mim?")) return;
    try {
      const res = await apiFetch(`/about-images/${imageId}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok && res.status !== 204) throw new Error("Erro ao excluir imagem");
      showToast("Imagem removida.");
      loadAboutImages();
    } catch (err) {
      showToast(err.message, "error");
    }
  }
});

aboutImagesGrid.addEventListener("change", async (event) => {
  if (!event.target.matches(".about-order-input")) return;
  const card = event.target.closest(".about-admin-card");
  try {
    await saveAboutCard(card, { quiet: true });
    showToast("Ordem atualizada!");
    loadAboutImages();
  } catch (err) {
    showToast(err.message, "error");
  }
});

aboutImagesGrid.addEventListener("dragstart", (event) => {
  const handle = event.target.closest(".about-drag-handle");
  if (!handle) {
    event.preventDefault();
    return;
  }
  draggedAboutCard = handle.closest(".about-admin-card");
  draggedAboutCard.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedAboutCard.dataset.id);
});

aboutImagesGrid.addEventListener("dragover", (event) => {
  if (!draggedAboutCard) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const target = event.target.closest(".about-admin-card");
  aboutImagesGrid.querySelectorAll(".drag-over").forEach((card) => card.classList.remove("drag-over"));
  if (!target || target === draggedAboutCard) return;
  target.classList.add("drag-over");

  const rect = target.getBoundingClientRect();
  const draggedRect = draggedAboutCard.getBoundingClientRect();
  const cardsShareRow = Math.abs(draggedRect.top - rect.top) < Math.min(draggedRect.height, rect.height) / 2;
  const afterTarget = cardsShareRow
    ? event.clientX > rect.left + rect.width / 2
    : event.clientY > rect.top + rect.height / 2;
  target.insertAdjacentElement(afterTarget ? "afterend" : "beforebegin", draggedAboutCard);
});

async function persistAboutOrder() {
  const cards = [...aboutImagesGrid.querySelectorAll(".about-admin-card")];
  const payload = cards.map((card, order) => ({ id: Number(card.dataset.id), order }));
  cards.forEach((card, order) => { card.querySelector(".about-order-input").value = order; });
  const res = await apiFetch("/about-images/reorder", {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Erro ao salvar a nova ordem");
}

aboutImagesGrid.addEventListener("drop", async (event) => {
  if (!draggedAboutCard) return;
  event.preventDefault();
  try {
    await persistAboutOrder();
    showToast("Nova ordem das imagens salva!");
    loadAboutImages();
  } catch (err) {
    showToast(err.message, "error");
    loadAboutImages();
  }
});

aboutImagesGrid.addEventListener("dragend", () => {
  aboutImagesGrid.querySelectorAll(".about-admin-card").forEach((card) => card.classList.remove("dragging", "drag-over"));
  draggedAboutCard = null;
});

/* =========================================================
   TRAJETÓRIA ACADÊMICA E PROFISSIONAL
   ========================================================= */
let currentCareerContent = { timeline: [], highlights: [] };

async function loadCareer() {
  careerTimelineEditor.innerHTML = '<p class="empty-row">Carregando...</p>';
  try {
    const res = await apiFetch("/career");
    if (!res.ok) throw new Error("Erro ao carregar a trajetória");
    currentCareerContent = await res.json();
    renderCareerEditors();
  } catch (err) {
    careerTimelineEditor.innerHTML = `<p class="empty-row">${escapeHTML(err.message)}</p>`;
  }
}

function timelineEditorRow(item = {}, index = 0) {
  return `
    <article class="career-editor-row timeline-editor-row">
      <span class="career-row-number">${String(index + 1).padStart(2, "0")}</span>
      <div class="field"><label>Ano ou período</label><input class="career-year" type="text" maxlength="50" value="${escapeHTML(item.year || "")}" required></div>
      <div class="field"><label>Título</label><input class="career-title" type="text" maxlength="160" value="${escapeHTML(item.title || "")}" required></div>
      <div class="field career-detail-field"><label>Instituição ou detalhe</label><textarea class="career-detail" maxlength="300" rows="2" required>${escapeHTML(item.detail || "")}</textarea></div>
      <div class="field career-order-field"><label>Ordem</label><input class="career-order" type="number" min="0" value="${Number.isFinite(Number(item.order)) ? Number(item.order) : index}"></div>
      <button class="icon-btn danger remove-career-row" type="button" aria-label="Remover item"><i class="ph ph-trash"></i></button>
    </article>`;
}

function refreshCareerRowNumbers(container) {
  [...container.querySelectorAll(".career-editor-row")].forEach((row, index) => {
    row.querySelector(".career-row-number").textContent = String(index + 1).padStart(2, "0");
  });
}

function renderCareerEditors() {
  const timeline = [...(currentCareerContent.timeline || [])].sort((a, b) => a.order - b.order);
  careerTimelineEditor.innerHTML = timeline.length
    ? timeline.map(timelineEditorRow).join("")
    : '<p class="empty-row">Nenhum marco cadastrado.</p>';
}

addTimelineItemBtn.addEventListener("click", () => {
  careerTimelineEditor.querySelector(".empty-row")?.remove();
  const index = careerTimelineEditor.querySelectorAll(".career-editor-row").length;
  careerTimelineEditor.insertAdjacentHTML("beforeend", timelineEditorRow({ order: index }, index));
});

careerTimelineEditor.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-career-row");
  if (!removeButton) return;
  removeButton.closest(".career-editor-row").remove();
  refreshCareerRowNumbers(careerTimelineEditor);
});

saveCareerBtn.addEventListener("click", async () => {
  careerFormError.hidden = true;
  const timelineRows = [...careerTimelineEditor.querySelectorAll(".timeline-editor-row")];
  const requiredFields = [...careerTimelineEditor.querySelectorAll("[required]")];
  const invalidField = requiredFields.find((field) => !field.value.trim());
  if (invalidField) {
    invalidField.focus();
    careerFormError.textContent = "Preencha todos os campos antes de salvar.";
    careerFormError.hidden = false;
    return;
  }

  const payload = {
    timeline: timelineRows.map((row, index) => ({
      year: row.querySelector(".career-year").value.trim(),
      title: row.querySelector(".career-title").value.trim(),
      detail: row.querySelector(".career-detail").value.trim(),
      order: Number(row.querySelector(".career-order").value || index),
    })),
    highlights: [],
  };

  try {
    saveCareerBtn.disabled = true;
    const res = await apiFetch("/career", {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao salvar a trajetória");
    }
    currentCareerContent = await res.json();
    renderCareerEditors();
    showToast("Trajetória atualizada no site!");
  } catch (err) {
    careerFormError.textContent = err.message;
    careerFormError.hidden = false;
  } finally {
    saveCareerBtn.disabled = false;
  }
});

/* =========================================================
   MENSAGENS DE CONTATO
   ========================================================= */
async function loadMessages() {
  messagesTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Carregando...</td></tr>`;
  try {
    const res = await apiFetch("/contact", { headers: authHeaders() });
    const messages = await res.json();

    if (!messages.length) {
      messagesTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Nenhuma mensagem recebida ainda.</td></tr>`;
      return;
    }

    messagesTableBody.innerHTML = messages
      .map(
        (m) => `
          <tr>
            <td>${escapeHTML(m.name)}</td>
            <td>${escapeHTML(m.email)}</td>
            <td>${escapeHTML(m.message)}</td>
            <td>${new Date(m.created_at).toLocaleString("pt-BR")}</td>
            <td><span class="badge ${m.email_sent ? "featured-yes" : "featured-no"}">${m.email_sent ? "Sim" : "Não"}</span></td>
          </tr>
        `
      )
      .join("");
  } catch (err) {
    messagesTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">${err.message}</td></tr>`;
  }
}
