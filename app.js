(() => {
  "use strict";

  const cfg = window.NUSA_CONFIG || {};
  const fallbackSettings = {
    brand_name: "Nusa Pixel",
    hero_title: "Build your digital presence.",
    hero_subtitle: "Kami membantu bisnis tampil lebih profesional melalui website yang modern, cepat, dan dirancang sesuai kebutuhan.",
    about_text: "Nusa Pixel adalah studio pengembangan website yang membantu bisnis, organisasi, dan individu membangun identitas digital yang profesional.",
    whatsapp: cfg.WHATSAPP_NUMBER || "",
    instagram: "",
    email: ""
  };

  let settings = { ...fallbackSettings };
  const hasSupabaseConfig =
    !!window.supabase &&
    typeof cfg.SUPABASE_URL === "string" &&
    cfg.SUPABASE_URL.startsWith("https://") &&
    typeof cfg.SUPABASE_ANON_KEY === "string" &&
    cfg.SUPABASE_ANON_KEY.length > 20 &&
    !cfg.SUPABASE_ANON_KEY.includes("YOUR_");

  const client = hasSupabaseConfig
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function getWhatsappNumber() {
    return String(settings.whatsapp || cfg.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  }

  function buildWhatsappUrl(message) {
    const number = getWhatsappNumber();
    if (!number || number.includes("X")) return "";
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function renderHeroTitle(title) {
    const heading = $("heroTitle");
    if (!heading) return;

    // Render dynamic text as escaped content so database values cannot inject HTML.
    const safeTitle = escapeHtml(title || fallbackSettings.hero_title);
    const match = safeTitle.match(/^(.*?)(digital presence\.?)$/i);

    if (match) {
      heading.innerHTML = `${match[1].replace(/\n/g, "<br>")}<span class="gradient-text">${match[2]}</span>`;
    } else {
      heading.textContent = title || fallbackSettings.hero_title;
    }
  }

  function applySettings() {
    renderHeroTitle(settings.hero_title);
    $("heroSubtitle").textContent = settings.hero_subtitle || fallbackSettings.hero_subtitle;
    $("aboutText").textContent = settings.about_text || fallbackSettings.about_text;

    const contactLink = $("contactWhatsapp");
    const url = buildWhatsappUrl("Halo Nusa Pixel, saya ingin konsultasi mengenai pembuatan website.");
    if (url) {
      contactLink.href = url;
      contactLink.target = "_blank";
      contactLink.rel = "noopener noreferrer";
      contactLink.removeAttribute("aria-disabled");
    } else {
      contactLink.href = "#order";
      contactLink.removeAttribute("target");
      contactLink.setAttribute("aria-disabled", "true");
    }
  }

  function createDAGBOEKPortfolioCard() {
    const card = document.createElement("article");
    card.className = "portfolio-card portfolio-featured";

    const visual = document.createElement("div");
    visual.className = "portfolio-image dagboek-visual";
    visual.setAttribute("role", "img");
    visual.setAttribute("aria-label", "Ilustrasi antarmuka sistem ERP DAGBOEK");

    visual.innerHTML = `
      <div class="dagboek-window">
        <div class="dagboek-sidebar"><span class="dagboek-mark"></span><i></i><i></i><i></i><i></i></div>
        <div class="dagboek-content">
          <div class="dagboek-topline"><span>DAGBOEK</span><b>by NUSA PIXEL</b></div>
          <div class="dagboek-welcome">Manager Dashboard</div>
          <div class="dagboek-stats"><i></i><i></i><i></i></div>
          <div class="dagboek-chart"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
      </div>`;

    const info = document.createElement("div");
    info.className = "portfolio-info";
    info.innerHTML = `
      <small>IN-HOUSE PRODUCT · ERP</small>
      <h3>DAGBOEK — Cooperative Management System</h3>
      <p>Sistem ERP yang dikembangkan Nusa Pixel untuk mendukung pencatatan keuangan, akuntansi, persediaan, transaksi, dan pemantauan operasional koperasi.</p>`;

    card.append(visual, info);
    return card;
  }

  function createPortfolioCard(item) {
    const card = document.createElement("article");
    card.className = "portfolio-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "portfolio-image";

    if (item.image_url) {
      const image = document.createElement("img");
      image.src = item.image_url;
      image.alt = item.title ? `Preview ${item.title}` : "Preview proyek Nusa Pixel";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      imageWrap.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "portfolio-placeholder";
      placeholder.textContent = "NUSA PIXEL";
      imageWrap.appendChild(placeholder);
    }

    const info = document.createElement("div");
    info.className = "portfolio-info";
    const category = document.createElement("small");
    category.textContent = item.category || "WEBSITE PROJECT";
    const title = document.createElement("h3");
    title.textContent = item.title || "Project Nusa Pixel";
    const description = document.createElement("p");
    description.textContent = item.description || "";

    info.append(category, title, description);
    card.append(imageWrap, info);
    return card;
  }

  function renderPortfolio(items) {
    const grid = $("portfolioGrid");
    if (!grid) return;
    grid.replaceChildren();

    if (items.length) {
      items.forEach((item) => grid.appendChild(createPortfolioCard(item)));
      return;
    }

    // DAGBOEK is presented as an internal product, not as a client testimonial or paid project.
    grid.appendChild(createDAGBOEKPortfolioCard());
  }

  async function loadContent() {
    if (!client) {
      applySettings();
      renderPortfolio([]);
      return;
    }

    try {
      const { data: siteSettings, error: settingsError } = await client
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (settingsError) console.warn("Pengaturan website belum dapat dimuat:", settingsError.message);
      if (siteSettings) settings = { ...settings, ...siteSettings };
      applySettings();

      const { data: portfolioItems, error: portfolioError } = await client
        .from("portfolio")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (portfolioError) throw portfolioError;
      renderPortfolio(portfolioItems || []);
    } catch (error) {
      console.warn("Konten Supabase belum tersedia:", error.message);
      applySettings();
      renderPortfolio([]);
    }
  }

  $("orderForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const number = getWhatsappNumber();
    if (!number || number.includes("X")) {
      alert("Nomor WhatsApp belum diatur. Silakan hubungi admin website.");
      return;
    }

    const service = $("serviceSelect").value.trim();
    const name = $("projectName").value.trim();
    const brief = $("projectBrief").value.trim();

    if (!service || !name) {
      alert("Mohon pilih layanan dan isi nama atau bisnis terlebih dahulu.");
      return;
    }

    const message = [
      "Halo Nusa Pixel! Saya ingin konsultasi pembuatan website.",
      "",
      `Layanan: ${service}`,
      `Nama/Bisnis: ${name}`,
      `Kebutuhan: ${brief || "-"}`
    ].join("\n");

    const url = buildWhatsappUrl(message);
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) window.location.href = url;
  });

  document.querySelectorAll(".choose-service").forEach((button) => {
    button.addEventListener("click", () => {
      $("serviceSelect").value = button.dataset.service || "";
      $("order").scrollIntoView({ behavior: "smooth", block: "start" });
      $("serviceSelect").focus({ preventScroll: true });
    });
  });

  const menuToggle = $("menuToggle");
  const mainNav = $("mainNav");

  menuToggle?.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Tutup navigasi" : "Buka navigasi");
  });

  document.querySelectorAll("#mainNav a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Buka navigasi");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mainNav?.classList.contains("open")) {
      mainNav.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Buka navigasi");
      menuToggle?.focus();
    }
  });

  $("year").textContent = new Date().getFullYear();
  loadContent();
})();


  // Give NUPI a subtle parallax response on desktop pointer movement.
  const mascotScene = $("mascotScene");
  const nupiMascot = $("nupiMascot");
  if (mascotScene && nupiMascot && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    mascotScene.addEventListener("pointermove", (event) => {
      const bounds = mascotScene.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      nupiMascot.style.transform = `translate3d(${x * 13}px,${y * 10}px,0) rotateY(${x * 7}deg) rotateX(${-y * 5}deg)`;
    });
    mascotScene.addEventListener("pointerleave", () => {
      nupiMascot.style.transform = "";
    });
  }
