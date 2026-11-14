// =====================================================================
// jnip-auth.js — gerbang login & pembayaran Jalan NIP Academy (Supabase + Midtrans Snap)
// Pakai:
//   import { createJNIP } from './jnip-auth.js';
//   const jnip = createJNIP(JNIP_CONFIG);
//   const { user, profile } = await jnip.gate();   // menunggu sampai akses aktif
//   ...lalu jalankan aplikasi Jalan NIP Academy
// =====================================================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");
const DOMAIN = "jalannip.app";
// Username → alamat internal Supabase (tidak pernah dipakai untuk mengirim email)
export const toEmail = (u) => { u = String(u || "").trim().toLowerCase(); return u.includes("@") ? u : `${u}@${DOMAIN}`; };
export const uname = (e) => String(e || "").endsWith("@" + DOMAIN) ? String(e).slice(0, -DOMAIN.length - 1) : String(e || "");
const USER_RE = /^[a-z0-9._]{3,20}$/;
const h = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function createJNIP(cfg) {
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let root = null;

  const GARUDA = cfg.garudaUrl || "garuda.png";
  const SCENE = `<svg class="scene" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="jn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc8f5"/><stop offset=".55" stop-color="#d9ebfc"/><stop offset="1" stop-color="#eef6fe"/></linearGradient>
    <linearGradient id="jn-bld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f2fd"/><stop offset="1" stop-color="#c4dbf6"/></linearGradient>
    <linearGradient id="jn-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3b8" stop-opacity="0"/><stop offset=".55" stop-color="#ffe27a"/><stop offset="1" stop-color="#f4c22e"/></linearGradient></defs>
    <rect width="1536" height="1024" fill="url(#jn-sky)"/>
    <g fill="#fff" opacity=".85"><ellipse cx="170" cy="140" rx="95" ry="22"/><circle cx="140" cy="128" r="30"/><circle cx="180" cy="116" r="36"/><circle cx="222" cy="132" r="24"/></g>
    <g fill="#fff" opacity=".8"><ellipse cx="1330" cy="102" rx="150" ry="20"/><circle cx="1290" cy="88" r="30"/><circle cx="1345" cy="72" r="42"/><circle cx="1400" cy="90" r="28"/></g>
    <g fill="#fff" opacity=".55"><circle cx="20" cy="330" r="180"/><circle cx="210" cy="420" r="150"/><circle cx="360" cy="470" r="110"/><circle cx="1500" cy="300" r="120"/><circle cx="1390" cy="360" r="90"/></g>
    <g class="bld">
      <line x1="1345" y1="312" x2="1345" y2="408" stroke="#7aa7dc" stroke-width="5"/>
      <rect x="1347" y="316" width="88" height="29" fill="#ef4444"/><rect x="1347" y="345" width="88" height="29" fill="#fff"/>
      <polygon points="1160,500 1345,402 1530,500" fill="#d9e9fb" stroke="#9ec2ec" stroke-width="6"/>
      <image href="${GARUDA}" x="1309" y="433" width="72" height="67"/>
      <rect x="1150" y="500" width="390" height="26" fill="#cfe2f8"/><rect x="1170" y="526" width="350" height="12" fill="#b8d3f2"/>
      <g fill="url(#jn-bld)">${[1190,1250,1310,1370,1430,1490].map((x) => `<rect x="${x}" y="540" width="26" height="128"/>`).join("")}</g>
      <rect x="1100" y="540" width="70" height="140" fill="#d3e5f9"/><rect x="1118" y="575" width="16" height="30" fill="#a9c8ee"/><rect x="1140" y="575" width="16" height="30" fill="#a9c8ee"/>
      <rect x="1150" y="668" width="390" height="14" fill="#c9def6"/><rect x="1130" y="682" width="420" height="14" fill="#bcd5f3"/><rect x="1110" y="696" width="440" height="16" fill="#aecbef"/>
      <g fill="#5fb37a"><circle cx="1085" cy="640" r="34"/><circle cx="1110" cy="610" r="28"/><circle cx="1135" cy="650" r="30"/></g>
      <g fill="#4aa36a"><circle cx="1505" cy="640" r="34"/><circle cx="1530" cy="612" r="30"/></g>
    </g>
    <g fill="#62b582"><circle cx="30" cy="660" r="46"/><circle cx="80" cy="630" r="38"/><circle cx="125" cy="665" r="34"/><circle cx="185" cy="700" r="30"/></g>
    <path d="M0 720 C250 650 520 700 760 760 C980 815 1250 760 1536 700 L1536 1024 L0 1024Z" fill="#cfe3fb"/>
    <path d="M0 820 C300 760 600 820 860 870 C1100 915 1320 860 1536 820 L1536 1024 L0 1024Z" fill="#7fb3f2"/>
    <path d="M820 1024 C1050 930 1300 850 1536 760 L1536 1024Z" fill="url(#jn-gold)"/>
    <path d="M0 900 C320 850 620 905 900 960 C1150 1005 1360 960 1536 905 L1536 1024 L0 1024Z" fill="#1f5ec4"/>
    <path d="M0 960 C360 925 700 975 1000 1000 C1250 1020 1420 1000 1536 975 L1536 1024 L0 1024Z" fill="#164aa3"/>
  </svg>`;
  const I = {
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
  };
  const ico = (k) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;

  function mount() {
    if (root) return root;
    root = document.createElement("div");
    root.id = "jnip-gate";
    root.innerHTML = `<style>
      #jnip-gate{position:fixed;inset:0;z-index:9999;display:flex;padding:20px;overflow:auto;box-sizing:border-box;font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif;background:#d9ebfc}
      #jnip-gate .scene{position:fixed;inset:0;width:100%;height:100%;z-index:-1}
      @media(max-width:760px){#jnip-gate .scene .bld{opacity:.35}}
      #jnip-gate .bx{position:relative;margin:auto;background:#fff;color:#0f1b2d;border-radius:26px;max-width:470px;width:100%;padding:34px 40px 26px;box-shadow:0 24px 60px rgba(30,80,150,.18);box-sizing:border-box}
      @media(max-width:520px){#jnip-gate .bx{padding:26px 22px 20px;border-radius:22px}}
      #jnip-gate .brand{display:flex;align-items:center;gap:14px;margin-bottom:26px}
      #jnip-gate .brand img{width:62px;height:62px;object-fit:contain;flex:none}
      #jnip-gate .brand .nm{display:flex;flex-direction:column;align-items:flex-start;line-height:1}
      #jnip-gate .brand .nm b{font-size:28px;font-weight:800;color:#1e4fd0;letter-spacing:-.5px}
      #jnip-gate .brand .nm i{font-style:normal;margin-top:4px;background:#1f63e0;color:#fff;font-weight:700;font-size:15px;padding:3px 11px 4px;border-radius:9px}
      #jnip-gate .brand .tg{border-left:1.5px solid #e3e8ef;padding-left:16px;margin-left:4px;font-size:13.5px;color:#3d4a5c;line-height:1.5;font-weight:500}
      @media(max-width:420px){#jnip-gate .brand .tg{display:none}}
      #jnip-gate h1{font-size:30px;font-weight:800;margin:0 0 6px;letter-spacing:-.4px}
      #jnip-gate p{color:#4b5768;margin:0 0 18px;font-size:15px;line-height:1.5}
      #jnip-gate label{display:block;font-size:15px;font-weight:600;color:#0f1b2d;margin:14px 0 7px}
      #jnip-gate .fld{display:flex;align-items:center;gap:10px;border:1.5px solid #dfe6ef;border-radius:12px;padding:0 14px;background:#fff;transition:border-color .15s,box-shadow .15s}
      #jnip-gate .fld:focus-within{border-color:#1f63e0;box-shadow:0 0 0 3px rgba(31,99,224,.12)}
      #jnip-gate .fld>svg{color:#6b7686;flex:none}
      #jnip-gate .fld input{flex:1;min-width:0;border:0;outline:0;padding:14px 0;font:inherit;font-size:15.5px;color:#0f1b2d;background:transparent}
      #jnip-gate .fld input::placeholder{color:#6b7686}
      #jnip-gate .eye{background:none;border:0;padding:4px;margin:0;color:#6b7686;cursor:pointer;display:flex;width:auto}
      #jnip-gate .hint{font-size:12.5px;color:#6b7686;margin:6px 0 0}
      #jnip-gate .row{display:flex;justify-content:flex-end;margin-top:10px}
      #jnip-gate .lnk{background:none;border:0;padding:4px 0;color:#1f55c8;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer}
      #jnip-gate .go{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:12px;padding:15px;font:inherit;font-size:17px;font-weight:700;background:#0b3f91;color:#fff;margin-top:20px;cursor:pointer;transition:background .15s}
      #jnip-gate .go:hover{background:#0a3478}#jnip-gate .go:disabled{opacity:.55;cursor:default}
      #jnip-gate .foot{border-top:1px solid #e8edf3;margin-top:26px;padding-top:18px;text-align:center;color:#4b5768;font-size:15px}
      #jnip-gate .foot a{color:#1f55c8;font-weight:600;text-decoration:underline;text-underline-offset:3px;cursor:pointer;margin-left:4px}
      #jnip-gate .msg{font-size:13.5px;margin-top:14px;padding:10px 12px;border-radius:10px;background:#eef4ff;color:#1e3f7a;line-height:1.45}
      #jnip-gate .err{background:#fdecec;color:#9a1f1f}
      #jnip-gate button.alt{width:100%;border:0;border-radius:12px;padding:13px;font:inherit;font-weight:700;background:#eef3fb;color:#0b3f91;margin-top:10px;cursor:pointer}
      #jnip-gate a.go{text-decoration:none;box-sizing:border-box}#jnip-gate .pend{width:64px;height:64px;border-radius:18px;background:#eef4ff;color:#1f55c8;display:grid;place-items:center;margin-bottom:14px}#jnip-gate .pend svg{width:32px;height:32px}#jnip-gate .pk{border:1.5px solid #e3e8ef;border-radius:14px;padding:14px;margin-top:10px;cursor:pointer}#jnip-gate .pk.on{border-color:#1f63e0;background:#eef4ff}
      #jnip-gate .pk b{display:block}#jnip-gate .pk .hr{font-size:20px;font-weight:800;color:#0b3f91}
    </style>${SCENE}<div class="bx" id="jnip-bx"></div>`;
    document.body.appendChild(root);
    return root;
  }
  const box = () => mount().querySelector("#jnip-bx");
  const brand = `<div class="brand"><img src="${cfg.logoUrl || "logo-jalannip.png"}" alt=""><div class="nm"><b>JalanNIP</b><i>Academy</i></div><div class="tg">Jalani prosesnya,<br>raih NIP-nya.</div></div>`;
  function unmount() { if (root) { root.remove(); root = null; } }

  async function getProfile() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { user: null, profile: null };
    const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return { user, profile };
  }
  const isActive = (p) => !!p && (p.is_admin || (p.akses_sampai && new Date(p.akses_sampai) > new Date()));

  function showAuth(mode, resolve, note) {
    const daftar = mode === "daftar";
    box().innerHTML = `${brand}<h1>${daftar ? "Buat Akun" : "Masuk ke Akun"}</h1>
      <p>${daftar ? "Buat akun untuk mulai persiapan CPNS-mu di JalanNIP Academy." : "Lanjutkan persiapan CPNS-mu di JalanNIP Academy."}</p>
      ${daftar ? `<label for="jn-nama">Nama</label><div class="fld">${ico("user")}<input id="jn-nama" autocomplete="name" placeholder="Masukkan nama kamu"></div>` : ""}
      <label for="jn-user">Username</label><div class="fld">${ico(daftar ? "at" : "user")}<input id="jn-user" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Masukkan username kamu"></div>
      ${daftar ? `<div class="hint">3–20 karakter: huruf kecil, angka, titik, atau garis bawah.</div>` : ""}
      <label for="jn-pass">Kata sandi</label><div class="fld">${ico("lock")}<input id="jn-pass" type="password" autocomplete="${daftar ? "new-password" : "current-password"}" placeholder="${daftar ? "Minimal 8 karakter" : "Masukkan kata sandi"}"><button type="button" class="eye" id="jn-eye" aria-label="Tampilkan kata sandi">${ico("eyeoff")}</button></div>
      ${daftar ? "" : `<div class="row"><button type="button" class="lnk" id="jn-lupa">Lupa kata sandi?</button></div>`}
      <button class="go" id="jn-go">${daftar ? "Daftar" : "Masuk"} ${ico("arrow")}</button>
      <div id="jn-msg">${note ? `<div class="msg">${h(note)}</div>` : ""}</div>
      <div class="foot">${daftar ? "Sudah punya akun?" : "Belum punya akun?"}<a id="jn-sw">${daftar ? "Masuk di sini" : "Daftar sekarang"}</a></div>`;
    const msg = (t, err) => { box().querySelector("#jn-msg").innerHTML = `<div class="msg ${err ? "err" : ""}">${h(t)}</div>`; };
    box().querySelector("#jn-sw").onclick = () => showAuth(daftar ? "masuk" : "daftar", resolve);
    const pass = box().querySelector("#jn-pass"), eye = box().querySelector("#jn-eye");
    eye.onclick = () => { const show = pass.type === "password"; pass.type = show ? "text" : "password"; eye.innerHTML = ico(show ? "eye" : "eyeoff"); eye.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"); };
    const lupa = box().querySelector("#jn-lupa");
    if (lupa) lupa.onclick = () => msg(cfg.lupaSandi || "Hubungi admin Jalan NIP Academy dan sebutkan username-mu. Admin akan mengatur kata sandi baru untukmu.");
    const go = async () => {
      const btn = box().querySelector("#jn-go"); btn.disabled = true;
      const user = box().querySelector("#jn-user").value.trim().toLowerCase(), password = pass.value;
      try {
        if (daftar) {
          const nama = box().querySelector("#jn-nama").value.trim();
          if (!USER_RE.test(user)) throw new Error("Username harus 3–20 karakter: huruf kecil, angka, titik, atau garis bawah.");
          if (password.length < 8) throw new Error("Kata sandi minimal 8 karakter.");
          const { data, error } = await sb.auth.signUp({ email: toEmail(user), password, options: { data: { nama, username: user } } });
          if (error) throw new Error(/already|registered|exists/i.test(error.message) ? "Username sudah dipakai. Coba yang lain." : error.message);
          if (!data.session) { showAuth("masuk", resolve, "Akun dibuat. Silakan masuk."); return; }
        } else {
          if (!user) throw new Error("Isi username dulu.");
          const { error } = await sb.auth.signInWithPassword({ email: toEmail(user), password });
          if (error) throw new Error("Username atau kata sandi salah.");
        }
        await afterLogin(resolve);
      } catch (err) { msg(err.message || "Terjadi kesalahan.", true); btn.disabled = false; }
    };
    box().querySelector("#jn-go").onclick = go;
    box().querySelectorAll("input").forEach((el) => el.onkeydown = (e) => { if (e.key === "Enter") go(); });
  }

  // Akun baru menunggu persetujuan admin (pembayaran diurus di luar aplikasi)
  let pollT = null;
  async function showPending(resolve, user, profile) {
    const habis = profile && profile.akses_sampai && new Date(profile.akses_sampai) <= new Date();
    const un = uname(user.email);
    const wa = String(cfg.waAdmin || "").replace(/\D/g, "").replace(/^0/, "62");
    const teks = encodeURIComponent(`Halo admin Jalan NIP Academy, saya ingin ${habis && profile.is_trial ? "membuka akses penuh untuk" : habis ? "memperpanjang" : "mengaktifkan"} akun dengan username: ${un}`);
    const trial = habis && profile.is_trial;
    box().innerHTML = `${brand}<div class="pend">${ico("clock")}</div><h1>${trial ? "Masa trial berakhir" : habis ? "Masa akses habis" : "Menunggu persetujuan"}</h1>
      <p>Akun <b>@${h(un)}</b> ${trial ? "sudah menyelesaikan masa trial. Hubungi admin untuk membuka akses penuh. Progres belajarmu tetap tersimpan." : habis ? "sudah melewati masa aktifnya. Hubungi admin untuk memperpanjang akses. Progres belajarmu tetap tersimpan." : "sudah terdaftar dan sedang menunggu persetujuan admin. Begitu admin menyetujui, halaman ini otomatis terbuka."}</p>
      ${cfg.infoAktivasi ? `<div class="msg">${h(cfg.infoAktivasi)}</div>` : ""}
      ${wa ? `<a class="go" href="https://wa.me/${wa}?text=${teks}" target="_blank" rel="noopener">${ico("chat")} Hubungi admin via WhatsApp</a>` : ""}
      <button class="${wa ? "alt" : "go"}" id="jn-cek">Cek status sekarang</button>
      <button class="alt" id="jn-out">Keluar dari akun</button><div id="jn-msg"></div>`;
    const msg = (t, err) => { box().querySelector("#jn-msg").innerHTML = `<div class="msg ${err ? "err" : ""}">${h(t)}</div>`; };
    const cek = async (manual) => {
      const { profile: p } = await getProfile();
      if (isActive(p)) { clearInterval(pollT); unmount(); resolve({ user, profile: p }); return; }
      if (manual) msg("Akunmu belum disetujui. Halaman ini akan terbuka otomatis setelah admin menyetujui.");
    };
    clearInterval(pollT); pollT = setInterval(() => cek(false), 20000);
    box().querySelector("#jn-cek").onclick = () => cek(true);
    box().querySelector("#jn-out").onclick = async () => { clearInterval(pollT); await sb.auth.signOut(); showAuth("masuk", resolve); };
  }

  function loadSnap() {
    if (window.snap) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = cfg.midtransProduction ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js";
      s.setAttribute("data-client-key", cfg.midtransClientKey);
      s.onload = () => res(); s.onerror = () => rej(new Error("Snap gagal dimuat"));
      document.head.appendChild(s);
    });
  }

  async function waitActive(resolve, msg, maxTries = 40) {
    msg("Memverifikasi pembayaran…");
    for (let i = 0; i < maxTries; i++) {
      const { user, profile } = await getProfile();
      if (isActive(profile)) { unmount(); resolve({ user, profile }); return; }
      await new Promise((r) => setTimeout(r, 3000));
    }
    msg("Pembayaran belum terkonfirmasi. Muat ulang halaman ini beberapa saat lagi.", true);
  }

  async function afterLogin(resolve) {
    const { user, profile } = await getProfile();
    if (!user) return showAuth("masuk", resolve);
    // akun admin hanya melihat konsol admin
    if (profile?.is_admin && cfg.adminUrl !== false && !new URLSearchParams(location.search).has("app")) { location.href = cfg.adminUrl || "admin.html"; return; }
    if (isActive(profile)) { unmount(); resolve({ user, profile }); return; }
    showPending(resolve, user, profile);
  }

  return {
    sb,
    /** Tampilkan login/pembayaran sampai akses aktif. */
    gate() {
      return new Promise(async (resolve) => {
        const { data: { session } } = await sb.auth.getSession();
        if (session) return afterLogin(resolve);
        showAuth("masuk", resolve);
      });
    },
    async signOut() { await sb.auth.signOut(); location.reload(); },
    /** Simpan seluruh state lokal Jalan NIP Academy (objek S) ke akun. Panggil dengan jeda, mis. tiap 30 detik bila berubah. */
    async saveProgress(data) {
      const { data: { user } } = await sb.auth.getUser(); if (!user) return;
      return sb.from("progress").upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
    },
    async loadProgress() {
      const { data } = await sb.from("progress").select("data").maybeSingle();
      return data?.data ?? null;
    },
    /** Tanya AI: soalId = kolom id tabel soal; messages = [{role,content}] berakhir dengan pertanyaan user. */
    async tanyaAI(soalId, jawaban, messages) {
      const { data, error } = await sb.functions.invoke("tanya-ai", { body: { soal_id: soalId, jawaban, messages } });
      if (error || data?.error) throw new Error(data?.error || "AI tidak tersedia");
      return data; // { text, sisa }
    },
    async kirimSkorArena(eventId, nama, skor) {
      const { data: { user } } = await sb.auth.getUser();
      return sb.from("arena_scores").insert({ event_id: eventId, user_id: user.id, nama, ...skor });
    },
  };
}
