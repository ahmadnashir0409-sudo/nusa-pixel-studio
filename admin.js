
(() => {
  const cfg = window.NUSA_CONFIG || {};

  const configured =
    window.supabase &&
    cfg.SUPABASE_URL?.startsWith("https://") &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("YOUR_");

  const client = configured
    ? window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY
      )
    : null;

  const $ = id => document.getElementById(id);

  let portfolio = [];

  let recoveryMode =
    new URLSearchParams(window.location.hash.slice(1))
      .get("type") === "recovery";

  const msg = (id, text) => {
    $(id).textContent = text;
  };

  function showRecovery() {
    $("loginPanel").hidden = true;
    $("dashboard").hidden = true;
    $("resetPanel").hidden = false;
  }

  function showDashboard(user) {
    $("loginPanel").hidden = !!user;
    $("dashboard").hidden = !user;
    $("resetPanel").hidden = true;

    if (user) {
      loadSettings();
      loadPortfolio();
    }
  }

  // =====================================
  // AUTHENTICATION
  // =====================================

  async function init() {
    if (!client) {
      msg(
        "loginMessage",
        "Konfigurasi Supabase belum diisi. Periksa config.js."
      );
      return;
    }

    client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryMode = true;
        showRecovery();
        return;
      }

      if (recoveryMode) {
        showRecovery();
        return;
      }

      if (event === "SIGNED_OUT") {
        showDashboard(null);
        return;
      }

      showDashboard(session?.user || null);
    });

    const { data, error } = await client.auth.getSession();

    if (error) {
      msg("loginMessage", error.message);
      return;
    }

    if (recoveryMode) {
      showRecovery();
    } else {
      showDashboard(data.session?.user || null);
    }
  }

  // LOGIN
  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();

    if (!client) return;

    msg("loginMessage", "Memeriksa akun...");

    const { error } = await client.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value
    });

    msg(
      "loginMessage",
      error ? error.message : "Berhasil masuk."
    );
  });

  // LUPA PASSWORD
  $("forgotPasswordBtn").addEventListener("click", async () => {
    if (!client) return;

    const email = $("loginEmail").value.trim();

    if (!email) {
      msg(
        "loginMessage",
        "Masukkan email admin terlebih dahulu."
      );
      $("loginEmail").focus();
      return;
    }

    msg("loginMessage", "Mengirim email pemulihan...");

    const redirectTo =
      window.location.href.split(/[?#]/)[0];

    try {
      const { error } =
        await client.auth.resetPasswordForEmail(email, {
          redirectTo
        });

      msg(
        "loginMessage",
        error
          ? error.message
          : "Permintaan pemulihan berhasil diproses. Periksa email admin dan folder spam."
      );
    } catch (error) {
      msg("loginMessage", error.message);
    }
  });

  // SIMPAN PASSWORD BARU
  $("resetPasswordForm").addEventListener("submit", async e => {
    e.preventDefault();

    if (!client) return;

    const password = $("newPassword").value;
    const confirmation = $("confirmPassword").value;

    if (password.length < 8) {
      msg(
        "resetMessage",
        "Password minimal 8 karakter."
      );
      return;
    }

    if (password !== confirmation) {
      msg(
        "resetMessage",
        "Konfirmasi password tidak cocok."
      );
      return;
    }

    msg("resetMessage", "Menyimpan password baru...");

    try {
      const { data, error } =
        await client.auth.updateUser({
          password
        });

      if (error) {
        msg("resetMessage", error.message);
        return;
      }

      recoveryMode = false;

      $("resetPasswordForm").reset();

      msg(
        "resetMessage",
        "Password berhasil diperbarui. Dashboard sedang dibuka..."
      );

      showDashboard(data.user);

    } catch (error) {
      msg("resetMessage", error.message);
    }
  });

  // LOGOUT
  $("logoutBtn").addEventListener("click", async () => {
    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    recoveryMode = false;
    showDashboard(null);
  });

  // =====================================
  // WEBSITE SETTINGS
  // =====================================

  async function loadSettings() {
    const { data, error } = await client
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      msg("settingsMessage", error.message);
      return;
    }

    const s = data || {};

    $("settingHeroTitle").value =
      s.hero_title || "Build your digital presence.";

    $("settingHeroSubtitle").value =
      s.hero_subtitle || "";

    $("settingAbout").value =
      s.about_text || "";

    $("settingWhatsapp").value =
      s.whatsapp || cfg.WHATSAPP_NUMBER || "";

    $("settingInstagram").value =
      s.instagram || "";

    $("settingEmail").value =
      s.email || "";
  }

  $("settingsForm").addEventListener("submit", async e => {
    e.preventDefault();

    if (!client) return;

    const payload = {
      id: 1,
      hero_title: $("settingHeroTitle").value,
      hero_subtitle: $("settingHeroSubtitle").value,
      about_text: $("settingAbout").value,
      whatsapp: $("settingWhatsapp").value.replace(/\D/g, ""),
      instagram: $("settingInstagram").value,
      email: $("settingEmail").value,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from("site_settings")
      .upsert(payload);

    msg(
      "settingsMessage",
      error
        ? error.message
        : "Pengaturan berhasil disimpan."
    );
  });

  // =====================================
  // PORTFOLIO
  // =====================================

  async function loadPortfolio() {
    const { data, error } = await client
      .from("portfolio")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      msg("portfolioMessage", error.message);
      return;
    }

    portfolio = data || [];
    renderList();
  }

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  function renderList() {
    const el = $("adminPortfolioList");

    if (!portfolio.length) {
      el.innerHTML =
        '<div class="admin-empty">Belum ada portofolio.</div>';
      return;
    }

    el.innerHTML = portfolio.map(p => `
      <div class="admin-item">
        <div>
          <strong>${esc(p.title)}</strong>
          <small>
            ${esc(p.category || "Tanpa kategori")}
            ·
            ${p.is_published ? "Dipublikasikan" : "Draft"}
          </small>
        </div>

        <div>
          <button data-edit="${esc(p.id)}">Edit</button>
          <button class="delete" data-delete="${esc(p.id)}">
            Hapus
          </button>
        </div>
      </div>
    `).join("");

    el.querySelectorAll("[data-edit]").forEach(b => {
      b.onclick = () => editPortfolio(b.dataset.edit);
    });

    el.querySelectorAll("[data-delete]").forEach(b => {
      b.onclick = () => deletePortfolio(b.dataset.delete);
    });
  }

  function editPortfolio(id) {
    const p = portfolio.find(
      x => String(x.id) === String(id)
    );

    if (!p) return;

    $("portfolioId").value = p.id;
    $("portfolioTitle").value = p.title;
    $("portfolioCategory").value = p.category || "";
    $("portfolioDescription").value = p.description || "";
    $("portfolioImage").value = p.image_url || "";
    $("portfolioPublished").checked = !!p.is_published;

    $("portfolioFormTitle").textContent =
      "Edit portofolio";

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }

  function resetForm() {
    $("portfolioForm").reset();
    $("portfolioId").value = "";
    $("portfolioPublished").checked = true;

    $("portfolioFormTitle").textContent =
      "Tambah portofolio";

    msg("portfolioMessage", "");
  }

  $("resetPortfolio").addEventListener("click", resetForm);

  $("portfolioForm").addEventListener("submit", async e => {
    e.preventDefault();

    if (!client) return;

    const id = $("portfolioId").value;

    const payload = {
      title: $("portfolioTitle").value,
      category: $("portfolioCategory").value,
      description: $("portfolioDescription").value,
      image_url: $("portfolioImage").value,
      is_published: $("portfolioPublished").checked,
      updated_at: new Date().toISOString()
    };

    const result = id
      ? await client.from("portfolio").update(payload).eq("id", id)
      : await client.from("portfolio").insert(payload);

    if (result.error) {
      msg("portfolioMessage", result.error.message);
      return;
    }

    msg(
      "portfolioMessage",
      "Portofolio berhasil disimpan."
    );

    resetForm();
    await loadPortfolio();
  });

  async function deletePortfolio(id) {
    if (!confirm("Hapus item portofolio ini?")) return;

    const { error } = await client
      .from("portfolio")
      .delete()
      .eq("id", id);

    msg(
      "portfolioMessage",
      error ? error.message : "Portofolio dihapus."
    );

    if (!error) await loadPortfolio();
  }

  // =====================================
  // DASHBOARD TABS
  // =====================================

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
      });

      ["settingsTab", "portfolioTab"].forEach(id => {
        $(id).hidden = id !== btn.dataset.tab;
      });
    });
  });

  // START
  init();

})();
