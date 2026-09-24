/* =========================================================
   CONFIG
   ========================================================= */
const API_BASE = "/api";

/* =========================================================
   LOADER
   ========================================================= */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  gsap.to(loader, {
    opacity: 0,
    duration: 0.6,
    delay: 0.3,
    onComplete: () => loader.remove(),
  });
  runHeroIntro();
});

/* =========================================================
   CURSOR PERSONALIZADO
   ========================================================= */
const cursorDot = document.getElementById("cursorDot");
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  window.addEventListener("mousemove", (e) => {
    gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.15 });
  });
  document.querySelectorAll("a, button, input, textarea").forEach((el) => {
    el.addEventListener("mouseenter", () => cursorDot.style.width = cursorDot.style.height = "40px");
    el.addEventListener("mouseleave", () => cursorDot.style.width = cursorDot.style.height = "22px");
  });
}

/* =========================================================
   NAVBAR: scroll state + mobile toggle + active link
   ========================================================= */
const navbar = document.getElementById("navbar");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
});

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

const sections = document.querySelectorAll("section[id], header[id]");
const navAnchors = document.querySelectorAll("[data-nav]");
window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((sec) => {
    const top = sec.offsetTop - 120;
    if (window.scrollY >= top) current = sec.getAttribute("id");
  });
  navAnchors.forEach((a) => {
    a.classList.toggle("active-link", a.getAttribute("href") === `#${current}`);
  });
});

/* =========================================================
   HERO INTRO ANIMATION (GSAP timeline)
   ========================================================= */
function runHeroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(".reveal-inner", { y: 0, duration: 0.9, stagger: 0.12 })
    .to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.6 }, "-=0.6")
    .to(".hero-subtitle", { opacity: 1, y: 0, duration: 0.6 }, "-=0.5")
    .to(".hero-actions", { opacity: 1, y: 0, duration: 0.6 }, "-=0.4")
    .to(".hero-photo-wrap", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5");

  gsap.set(".reveal-inner", { y: "110%" });
  gsap.to(".reveal-inner", { y: "0%", duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.2 });
}

/* =========================================================
   SCROLL-TRIGGERED REVEALS (GSAP ScrollTrigger)
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray(".anim-fade-up:not(.timeline-item)").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });
});

gsap.utils.toArray(".timeline-item").forEach((item, i) => {
  gsap.from(item, {
    opacity: 0,
    x: -40,
    scale: 0.94,
    duration: 0.7,
    delay: i * 0.05,
    scrollTrigger: {
      trigger: item,
      start: "top 88%",
      toggleActions: "play none none none",
      once: true,
    },
  });
});

/* Linha da timeline "cresce" acompanhando o scroll */
const activeTimeline = document.querySelector(".timeline:not([hidden])");
if (activeTimeline) {
  gsap.to(activeTimeline.querySelector(".timeline-line"), {
    scaleY: 1,
    ease: "none",
    scrollTrigger: {
      trigger: activeTimeline,
      start: "top 75%",
      end: "bottom 85%",
      scrub: 0.6,
    },
  });
}

/* Número e título de cada seção entram com efeitos distintos */
gsap.utils.toArray(".section-number").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    scale: 1,
    rotate: 0,
    duration: 0.6,
    ease: "back.out(2)",
    scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
  });
});

gsap.utils.toArray(".section-title").forEach((el) => {
  gsap.to(el, {
    clipPath: "inset(0 0% 0 0)",
    duration: 0.9,
    ease: "power4.inOut",
    scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
  });
});

/* Cards de destaque da seção "Sobre" entram em stagger */
gsap.utils.toArray(".stat-card").forEach((card, i) => {
  gsap.to(card, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    delay: i * 0.08,
    ease: "back.out(1.7)",
    scrollTrigger: { trigger: ".sobre-stats", start: "top 82%", toggleActions: "play none none reverse" },
  });
});

/* =========================================================
   CARROSSEL DA SEÇÃO "SOBRE"
   ========================================================= */
const carouselTrack = document.getElementById("carouselTrack");
const carouselViewport = document.querySelector(".carousel-viewport");
const carouselSlides = Array.from(carouselTrack.children);
const carouselPrevBtn = document.getElementById("carouselPrev");
const carouselNextBtn = document.getElementById("carouselNext");
const carouselDotsWrap = document.getElementById("carouselDots");

let carouselIndex = 0;
let carouselTimer = null;

carouselSlides.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "carousel-dot";
  dot.setAttribute("aria-label", `Ir para foto ${i + 1}`);
  dot.addEventListener("click", () => goToSlide(i));
  carouselDotsWrap.appendChild(dot);
});
const carouselDots = Array.from(carouselDotsWrap.children);

function updateCarousel() {
  carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
  carouselSlides.forEach((slide, i) => {
    const isActive = i === carouselIndex;
    slide.tabIndex = isActive ? 0 : -1;
    slide.setAttribute("aria-hidden", String(!isActive));
  });
  carouselDots.forEach((dot, i) => dot.classList.toggle("active", i === carouselIndex));
}

function goToSlide(index) {
  carouselIndex = (index + carouselSlides.length) % carouselSlides.length;
  updateCarousel();
  resetCarouselAutoplay();
}

function startCarouselAutoplay() {
  carouselTimer = setInterval(() => goToSlide(carouselIndex + 1), 4500);
}
function resetCarouselAutoplay() {
  clearInterval(carouselTimer);
  startCarouselAutoplay();
}

carouselPrevBtn.addEventListener("click", () => goToSlide(carouselIndex - 1));
carouselNextBtn.addEventListener("click", () => goToSlide(carouselIndex + 1));
carouselViewport.addEventListener("mouseenter", () => clearInterval(carouselTimer));
carouselViewport.addEventListener("mouseleave", startCarouselAutoplay);

updateCarousel();
startCarouselAutoplay();

/* =========================================================
   LIGHTBOX DA GALERIA (Sobre)
   ========================================================= */
const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

const galleryPhotos = galleryItems.map((item) => ({
  src: item.querySelector("img").src,
  alt: item.querySelector("img").alt,
  caption: item.querySelector("figcaption").textContent,
}));

let currentPhotoIndex = 0;

function showPhoto(index) {
  currentPhotoIndex = (index + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[currentPhotoIndex];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.alt;
  lightboxCaption.textContent = photo.caption;
}

function openLightbox(index) {
  showPhoto(index);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => openLightbox(index));
  item.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(index);
    }
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => showPhoto(currentPhotoIndex - 1));
lightboxNext.addEventListener("click", () => showPhoto(currentPhotoIndex + 1));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showPhoto(currentPhotoIndex - 1);
  if (e.key === "ArrowRight") showPhoto(currentPhotoIndex + 1);
});

/* Links de contato entram em stagger */
gsap.utils.toArray(".contato-links li").forEach((li, i) => {
  gsap.to(li, {
    opacity: 1,
    x: 0,
    duration: 0.5,
    delay: i * 0.08,
    ease: "power2.out",
    scrollTrigger: { trigger: ".contato-links", start: "top 85%", toggleActions: "play none none reverse" },
  });
});

/* Barra de progresso de leitura, acompanha o scroll da página inteira */
gsap.to("#scrollProgress", {
  scaleX: 1,
  ease: "none",
  scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
});

/* Parallax leve nas formas do hero */
gsap.to(".shape-1", { y: 60, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
gsap.to(".shape-2", { y: -40, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
gsap.to(".shape-3", { y: 30, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });

/* =========================================================
   PROJETOS: fetch + render + filtro + busca
   ========================================================= */
const projetosGrid = document.getElementById("projetosGrid");
const projetosEmpty = document.getElementById("projetosEmpty");
const filterChips = document.getElementById("filterChips");
const searchInput = document.getElementById("searchInput");

let allProjects = [];
let activeCategory = "";
let searchTimeout = null;
let projectScrollTriggers = [];

const STATUS_LABEL = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

function projectCardHTML(p) {
  const tags = (p.tech_stack || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((t) => `<span>${escapeHTML(t)}</span>`)
    .join("");

  const links = `
    ${p.demo_url ? `<a href="${p.demo_url}" target="_blank" rel="noopener" aria-label="Ver demo"><i class="ph-bold ph-arrow-up-right"></i></a>` : ""}
    ${p.repo_url ? `<a href="${p.repo_url}" target="_blank" rel="noopener" aria-label="Ver repositório"><i class="ph-bold ph-github-logo"></i></a>` : ""}
  `;

  return `
    <article class="project-card ${p.featured ? "featured" : ""}">
      <div class="project-body">
        ${p.category ? `<span class="project-category">${escapeHTML(p.category)}</span>` : ""}
        <h3 class="project-title">${escapeHTML(p.title)}</h3>
        <p class="project-desc">${escapeHTML(p.description)}</p>
        ${tags ? `<div class="project-tags">${tags}</div>` : ""}
        <div class="project-footer">
          <span class="project-status ${p.status}">${STATUS_LABEL[p.status] || p.status}</span>
          <div class="project-links">${links}</div>
        </div>
      </div>
    </article>
  `;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function renderProjects(projects) {
  if (!projects.length) {
    projetosGrid.innerHTML = "";
    projetosEmpty.hidden = false;
    return;
  }
  projetosEmpty.hidden = true;
  projetosGrid.innerHTML = projects.map(projectCardHTML).join("");

  projectScrollTriggers.forEach((st) => st.kill());
  projectScrollTriggers = [];

  gsap.utils.toArray("#projetosGrid .project-card").forEach((card, i) => {
    const tween = gsap.from(card, {
      opacity: 0,
      y: 30,
      scale: 0.96,
      duration: 0.5,
      delay: i * 0.04,
      ease: "power2.out",
      scrollTrigger: { trigger: card, start: "top 92%" },
    });
    if (tween.scrollTrigger) projectScrollTriggers.push(tween.scrollTrigger);
  });
}

async function fetchProjects() {
  const params = new URLSearchParams();
  if (activeCategory) params.set("category", activeCategory);
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());

  try {
    const res = await fetch(`${API_BASE}/projects?${params.toString()}`);
    if (!res.ok) throw new Error("Falha ao buscar projetos");
    allProjects = await res.json();
    renderProjects(allProjects);
  } catch (err) {
    console.error(err);
    projetosGrid.innerHTML = "";
    projetosEmpty.hidden = false;
    projetosEmpty.textContent = "Não foi possível carregar os projetos agora. Tente novamente mais tarde.";
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/projects/categories`);
    if (!res.ok) return;
    const categories = await res.json();
    categories.forEach((cat) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.dataset.category = cat;
      chip.textContent = cat;
      filterChips.appendChild(chip);
    });
  } catch (err) {
    console.error(err);
  }
}

filterChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  filterChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
  activeCategory = chip.dataset.category || "";
  fetchProjects();
});

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchProjects, 350);
});

loadCategories();
fetchProjects();

/* =========================================================
   LIVROS: fetch + render
   ========================================================= */
const livrosGrid = document.getElementById("livrosGrid");
const livrosEmpty = document.getElementById("livrosEmpty");
let bookScrollTriggers = [];

function bookCardHTML(b) {
  const cover = b.cover_image
    ? `<img src="${b.cover_image}" alt="${escapeHTML(b.title)}" loading="lazy">`
    : `<div class="no-cover"><i class="ph ph-book"></i></div>`;

  return `
    <article class="book-card">
      <div class="book-cover">${cover}</div>
      <div class="book-body">
        ${b.year ? `<span class="book-year">${escapeHTML(b.year)}</span>` : ""}
        <h3 class="book-title">${escapeHTML(b.title)}</h3>
        ${b.publisher ? `<span class="book-publisher">${escapeHTML(b.publisher)}</span>` : ""}
        <p class="book-desc">${escapeHTML(b.description)}</p>
        ${
          b.external_url
            ? `<a class="book-link" href="${b.external_url}" target="_blank" rel="noopener">Ler mais <i class="ph-bold ph-arrow-up-right"></i></a>`
            : ""
        }
      </div>
    </article>
  `;
}

async function fetchBooks() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error("Falha ao buscar livros");
    const books = await res.json();

    if (!books.length) {
      livrosGrid.innerHTML = "";
      livrosEmpty.hidden = false;
      return;
    }
    livrosEmpty.hidden = true;
    livrosGrid.innerHTML = books.map(bookCardHTML).join("");

    bookScrollTriggers.forEach((st) => st.kill());
    bookScrollTriggers = [];

    gsap.utils.toArray("#livrosGrid .book-card").forEach((card, i) => {
      const tween = gsap.from(card, {
        opacity: 0,
        y: 30,
        scale: 0.96,
        duration: 0.5,
        delay: i * 0.05,
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 92%" },
      });
      if (tween.scrollTrigger) bookScrollTriggers.push(tween.scrollTrigger);
    });
  } catch (err) {
    console.error(err);
    livrosGrid.innerHTML = "";
    livrosEmpty.hidden = false;
    livrosEmpty.textContent = "Não foi possível carregar os livros agora. Tente novamente mais tarde.";
  }
}

fetchBooks();

/* =========================================================
   FORMULÁRIO DE CONTATO
   ========================================================= */
const contactForm = document.getElementById("contactForm");
const contactSubmit = document.getElementById("contactSubmit");
const formFeedback = document.getElementById("formFeedback");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    message: document.getElementById("message").value.trim(),
  };

  contactSubmit.disabled = true;
  const originalText = contactSubmit.innerHTML;
  contactSubmit.innerHTML = "Enviando... <i class='ph-bold ph-circle-notch'></i>";

  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Erro ao enviar mensagem");
    }
    formFeedback.textContent = "Mensagem enviada com sucesso! Retorno em breve. 🎉";
    formFeedback.className = "form-feedback success";
    formFeedback.hidden = false;
    contactForm.reset();
  } catch (err) {
    formFeedback.textContent = typeof err.message === "string" ? err.message : "Não foi possível enviar. Tente novamente.";
    formFeedback.className = "form-feedback error";
    formFeedback.hidden = false;
  } finally {
    contactSubmit.disabled = false;
    contactSubmit.innerHTML = originalText;
  }
});

/* =========================================================
   RODAPÉ: ano atual
   ========================================================= */
document.getElementById("year").textContent = new Date().getFullYear();
