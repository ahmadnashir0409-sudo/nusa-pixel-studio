(() => {
  const cfg = window.NUSA_CONFIG || {};
  const fallbackSettings = {
    brand_name: "Nusa Pixel",
    hero_title: "Build your digital presence.",
    hero_subtitle: "Kami membantu bisnis tampil lebih profesional melalui website yang modern, cepat, dan dirancang sesuai kebutuhan.",
    about_text: "Nusa Pixel adalah studio pengembangan website yang membantu bisnis, organisasi, dan individu membangun identitas digital yang profesional.",
    whatsapp: cfg.WHATSAPP_NUMBER || "628XXXXXXXXXX",
    instagram: "",
    email: ""
  };
  let settings = {...fallbackSettings};
  const client = (window.supabase && cfg.SUPABASE_URL?.startsWith("https://") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_"))
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const $ = (id) => document.getElementById(id);
  const waUrl = (message) => `https://wa.me/${String(settings.whatsapp || "").replace(/\D/g,"")}?text=${encodeURIComponent(message)}`;
  function applySettings() {
    $("heroTitle").innerHTML = (settings.hero_title || fallbackSettings.hero_title).replace(/digital presence/i, '<span class="gradient-text">digital presence.</span>').replace(/\n/g,"<br>");
    $("heroSubtitle").textContent = settings.hero_subtitle || fallbackSettings.hero_subtitle;
    $("aboutText").textContent = settings.about_text || fallbackSettings.about_text;
    $("contactWhatsapp").href = waUrl("Halo Nusa Pixel, saya ingin konsultasi mengenai pembuatan website.");
  }
  async function loadContent() {
    if (!client) { applySettings(); return; }
    try {
      const {data: s} = await client.from("site_settings").select("*").eq("id",1).maybeSingle();
      if (s) settings = {...settings, ...s};
      applySettings();
      const {data: items, error} = await client.from("portfolio").select("*").eq("is_published",true).order("created_at",{ascending:false});
      if (error) throw error;
      renderPortfolio(items || []);
    } catch (e) { console.warn("Konten Supabase belum tersedia:", e.message); applySettings(); }
  }
  function renderPortfolio(items) {
    const grid = $("portfolioGrid");
    if (!items.length) { grid.innerHTML = '<div class="empty-state">Portofolio sedang disiapkan. Karya Nusa Pixel akan segera hadir di sini.</div>'; return; }
    grid.innerHTML = items.map(p => `<article class="portfolio-card"><div class="portfolio-image">${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" loading="lazy">` : `<div class="portfolio-placeholder">NUSA PIXEL</div>`}</div><div class="portfolio-info"><small>${escapeHtml(p.category || "WEBSITE PROJECT")}</small><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description || "")}</p></div></article>`).join("");
  }
  function escapeHtml(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  $("orderForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!settings.whatsapp || settings.whatsapp.includes("X")) { alert("Nomor WhatsApp belum diatur. Hubungi admin website."); return; }
    const service = $("serviceSelect").value, name = $("projectName").value.trim(), brief = $("projectBrief").value.trim();
    const message = `Halo Nusa Pixel! Saya ingin konsultasi pembuatan website.%0A%0ALayanan: ${service}%0ANama/Bisnis: ${name}%0AKebutuhan: ${brief || "-"}`;
    window.open(waUrl(message.replace(/%0A/g,"\n")), "_blank", "noopener");
  });
  document.querySelectorAll(".choose-service").forEach(btn => btn.addEventListener("click", () => { $("serviceSelect").value = btn.dataset.service; $("order").scrollIntoView({behavior:"smooth"}); }));
  $("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
  document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => $("mainNav").classList.remove("open")));
  $("year").textContent = new Date().getFullYear();
  loadContent();
})();
