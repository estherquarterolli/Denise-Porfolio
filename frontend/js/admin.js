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
    bookCoverFieldWrap.hidden = false;
    renderBookCoverPreview(book.cover_image);
  } else {
    bookModalTitle.textContent = "Novo livro";
    document.getElementById("bookId").value = "";
    deleteBookBtn.hidden = true;
    bookCoverFieldWrap.hidden = true;
    bookCoverPreview.innerHTML = "";
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
    const saved = await res.json();
    showToast(isEdit ? "Livro atualizado!" : "Livro criado! Agora você pode adicionar a capa.");

    if (!isEdit) {
      openBookModal(saved);
    } else {
      closeBookModal();
    }
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
    </div>
  `;
}

bookCoverInput.addEventListener("change", async () => {
  if (!editingBook || !bookCoverInput.files.length) return;
  const file = bookCoverInput.files[0];
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await apiFetch(`/books/${editingBook.id}/cover`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao enviar capa");
    }
    const updated = await res.json();
    editingBook.cover_image = updated.cover_image;
    renderBookCoverPreview(updated.cover_image);
    showToast("Capa atualizada!");
    bookCoverInput.value = "";
    loadBooks();
  } catch (err) {
    showToast(err.message, "error");
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
