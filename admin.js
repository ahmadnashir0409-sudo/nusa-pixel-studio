(() => {
  const cfg = window.NUSA_CONFIG || {};
  const configured = window.supabase && cfg.SUPABASE_URL?.startsWith("https://") && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_");
  const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY) : null;
  const $ = id => document.getElementById(id);
  let portfolio = [];
  const msg = (id,text) => { $(id).textContent = text; };
  function showDashboard(user) { $("loginPanel").hidden = !!user; $("dashboard").hidden = !user; if(user){loadSettings();loadPortfolio();} }
  async function init() {
    if(!client){msg("loginMessage","Konfigurasi Supabase belum diisi. Ikuti README.md terlebih dahulu.");return;}
    const {data:{session}} = await client.auth.getSession(); showDashboard(session?.user || null);
    client.auth.onAuthStateChange((_event,session)=>showDashboard(session?.user || null));
  }
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client)return;msg("loginMessage","Memeriksa akun...");const {error}=await client.auth.signInWithPassword({email:$("loginEmail").value,password:$("loginPassword").value});msg("loginMessage",error?error.message:"Berhasil masuk.");});
  $("logoutBtn").addEventListener("click",async()=>{await client?.auth.signOut();showDashboard(null);});
  async function loadSettings(){const {data,error}=await client.from("site_settings").select("*").eq("id",1).maybeSingle();if(error){msg("settingsMessage",error.message);return;}const s=data||{};$("settingHeroTitle").value=s.hero_title||"Build your digital presence."; $("settingHeroSubtitle").value=s.hero_subtitle||"";$("settingAbout").value=s.about_text||"";$("settingWhatsapp").value=s.whatsapp||cfg.WHATSAPP_NUMBER||"";$("settingInstagram").value=s.instagram||"";$("settingEmail").value=s.email||"";}
  $("settingsForm").addEventListener("submit",async e=>{e.preventDefault();const payload={id:1,hero_title:$("settingHeroTitle").value,hero_subtitle:$("settingHeroSubtitle").value,about_text:$("settingAbout").value,whatsapp:$("settingWhatsapp").value.replace(/\D/g,""),instagram:$("settingInstagram").value,email:$("settingEmail").value,updated_at:new Date().toISOString()};const {error}=await client.from("site_settings").upsert(payload);msg("settingsMessage",error?error.message:"Pengaturan berhasil disimpan.");});
  async function loadPortfolio(){const {data,error}=await client.from("portfolio").select("*").order("created_at",{ascending:false});if(error){msg("portfolioMessage",error.message);return;}portfolio=data||[];renderList();}
  function renderList(){const el=$("adminPortfolioList");if(!portfolio.length){el.innerHTML='<div class="admin-empty">Belum ada portofolio.</div>';return;}el.innerHTML=portfolio.map(p=>`<div class="admin-item"><div><strong>${esc(p.title)}</strong><small>${esc(p.category||"Tanpa kategori")} · ${p.is_published?"Dipublikasikan":"Draft"}</small></div><div><button data-edit="${p.id}">Edit</button><button class="delete" data-delete="${p.id}">Hapus</button></div></div>`).join("");el.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editPortfolio(b.dataset.edit));el.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deletePortfolio(b.dataset.delete));}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function editPortfolio(id){const p=portfolio.find(x=>String(x.id)===String(id));if(!p)return;$("portfolioId").value=p.id;$("portfolioTitle").value=p.title;$("portfolioCategory").value=p.category||"";$("portfolioDescription").value=p.description||"";$("portfolioImage").value=p.image_url||"";$("portfolioPublished").checked=!!p.is_published;$("portfolioFormTitle").textContent="Edit portofolio";window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});}
  function resetForm(){$("portfolioForm").reset();$("portfolioId").value="";$("portfolioPublished").checked=true;$("portfolioFormTitle").textContent="Tambah portofolio";msg("portfolioMessage","");}
  $("resetPortfolio").addEventListener("click",resetForm);
  $("portfolioForm").addEventListener("submit",async e=>{e.preventDefault();const id=$("portfolioId").value;const payload={title:$("portfolioTitle").value,category:$("portfolioCategory").value,description:$("portfolioDescription").value,image_url:$("portfolioImage").value,is_published:$("portfolioPublished").checked,updated_at:new Date().toISOString()};const result=id?await client.from("portfolio").update(payload).eq("id",id):await client.from("portfolio").insert(payload);if(result.error){msg("portfolioMessage",result.error.message);return;}msg("portfolioMessage","Portofolio berhasil disimpan.");resetForm();await loadPortfolio();});
  async function deletePortfolio(id){if(!confirm("Hapus item portofolio ini?"))return;const {error}=await client.from("portfolio").delete().eq("id",id);msg("portfolioMessage",error?error.message:"Portofolio dihapus.");if(!error)loadPortfolio();}
  document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active",b===btn));["settingsTab","portfolioTab"].forEach(id=>$(id).hidden=id!==btn.dataset.tab);}));
  init();
})();
