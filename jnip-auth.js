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
const h = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function createJNIP(cfg) {
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let root = null;

  function mount() {
    if (root) return root;
    root = document.createElement("div");
    root.id = "jnip-gate";
    root.innerHTML = `<style>
      #jnip-gate{position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#1d4e7a,#0f2e4a);display:grid;place-items:center;padding:16px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
      #jnip-gate .bx{background:#fff;color:#17202b;border-radius:18px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
      #jnip-gate h1{font-size:22px;margin:0 0 4px}#jnip-gate p{color:#5f6b78;margin:0 0 14px;font-size:14px;line-height:1.5}
      #jnip-gate label{display:block;font-size:13px;font-weight:600;color:#5f6b78;margin:10px 0 4px}
      #jnip-gate input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #e3e8ef;border-radius:10px;font:inherit}
      #jnip-gate button{width:100%;border:0;border-radius:12px;padding:12px;font:inherit;font-weight:700;background:#1d4e7a;color:#fff;margin-top:14px;cursor:pointer}
      #jnip-gate button.alt{background:#eef3f8;color:#1d4e7a}#jnip-gate button:disabled{opacity:.5}
      #jnip-gate .lnk{background:none;color:#1d4e7a;padding:6px;margin-top:6px;font-weight:600}
      #jnip-gate .msg{font-size:13px;margin-top:10px;padding:8px 10px;border-radius:8px;background:#fbf1da;color:#6b4e08}
      #jnip-gate .err{background:#fbe6e6;color:#8a2020}
      #jnip-gate .brand{display:flex;align-items:center;gap:8px;font-weight:800;color:#1d4e7a;margin-bottom:14px;font-size:18px}
      #jnip-gate .brand img{width:44px;height:44px;object-fit:contain}#jnip-gate .brand span{display:flex;flex-direction:column;line-height:1.1;color:#1757b0;font-size:22px}#jnip-gate .brand small{font-size:11.5px;font-weight:500;color:#5f6b78;margin-top:3px}
      #jnip-gate .pk{border:1.5px solid #e3e8ef;border-radius:14px;padding:14px;margin-top:10px;cursor:pointer}#jnip-gate .pk.on{border-color:#1d4e7a;background:#e6eef6}
      #jnip-gate .pk b{display:block}#jnip-gate .pk .hr{font-size:20px;font-weight:800;color:#1d4e7a}
    </style><div class="bx" id="jnip-bx"></div>`;
    document.body.appendChild(root);
    return root;
  }
  const box = () => mount().querySelector("#jnip-bx");
  const brand = `<div class="brand"><img src="${cfg.logoUrl || "logo-jalannip.png"}" alt=""><span>JalanNIP<small>Jalani prosesnya, raih NIP-nya.</small></span></div>`;
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
    box().innerHTML = `${brand}<h1>${daftar ? "Buat akun" : "Masuk"}</h1><p>${daftar ? "Daftar untuk mulai latihan SKD CPNS." : "Masuk ke akun Jalan NIP Academy-mu."}</p>
      ${daftar ? `<label>Nama</label><input id="jn-nama" autocomplete="name">` : ""}
      <label>Email</label><input id="jn-email" type="email" autocomplete="email">
      <label>Kata sandi</label><input id="jn-pass" type="password" autocomplete="${daftar ? "new-password" : "current-password"}">
      <button id="jn-go">${daftar ? "Daftar" : "Masuk"}</button>
      <button class="lnk" id="jn-sw">${daftar ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}</button>
      ${daftar ? "" : `<button class="lnk" id="jn-lupa">Lupa kata sandi</button>`}
      <div id="jn-msg">${note ? `<div class="msg">${h(note)}</div>` : ""}</div>`;
    const msg = (t, err) => { box().querySelector("#jn-msg").innerHTML = `<div class="msg ${err ? "err" : ""}">${h(t)}</div>`; };
    box().querySelector("#jn-sw").onclick = () => showAuth(daftar ? "masuk" : "daftar", resolve);
    const lupa = box().querySelector("#jn-lupa");
    if (lupa) lupa.onclick = async () => {
      const email = box().querySelector("#jn-email").value.trim();
      if (!email) return msg("Isi email dulu.", true);
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      msg(error ? error.message : "Tautan atur ulang kata sandi sudah dikirim ke email.", !!error);
    };
    box().querySelector("#jn-go").onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true;
      const email = box().querySelector("#jn-email").value.trim(), password = box().querySelector("#jn-pass").value;
      try {
        if (daftar) {
          const nama = box().querySelector("#jn-nama").value.trim();
          if (password.length < 8) throw new Error("Kata sandi minimal 8 karakter.");
          const { data, error } = await sb.auth.signUp({ email, password, options: { data: { nama }, emailRedirectTo: location.origin + location.pathname } });
          if (error) throw error;
          if (!data.session) { showAuth("masuk", resolve, "Cek email untuk konfirmasi akun, lalu masuk di sini."); return; }
        } else {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw new Error("Email atau kata sandi salah.");
        }
        await afterLogin(resolve);
      } catch (err) { msg(err.message || "Terjadi kesalahan.", true); btn.disabled = false; }
    };
  }

  async function showPaywall(resolve, user) {
    const { data: paket } = await sb.from("paket").select("*").eq("aktif", true).order("urutan");
    let sel = paket?.[0]?.id;
    box().innerHTML = `${brand}<h1>Aktifkan akses</h1><p>Akun <b>${h(user.email)}</b> belum memiliki akses aktif. Pilih paket lalu bayar dengan QRIS, transfer bank (VA), atau e-wallet.</p>
      <div id="jn-pk">${(paket || []).map((p) => `<div class="pk ${p.id === sel ? "on" : ""}" data-id="${h(p.id)}"><b>${h(p.nama)}</b><span class="hr">${rupiah(p.harga)}</span><br><small>Berlaku ${p.durasi_hari} hari</small></div>`).join("")}</div>
      <label>Kode voucher (opsional)</label><input id="jn-v" style="text-transform:uppercase">
      <button id="jn-pay">Bayar sekarang</button><button class="lnk" id="jn-out">Keluar dari akun</button><div id="jn-msg"></div>`;
    const msg = (t, err) => { box().querySelector("#jn-msg").innerHTML = `<div class="msg ${err ? "err" : ""}">${h(t)}</div>`; };
    box().querySelectorAll(".pk").forEach((el) => el.onclick = () => { sel = el.dataset.id; box().querySelectorAll(".pk").forEach((x) => x.classList.toggle("on", x === el)); });
    box().querySelector("#jn-out").onclick = async () => { await sb.auth.signOut(); showAuth("masuk", resolve); };
    box().querySelector("#jn-pay").onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true; msg("Menyiapkan pembayaran…");
      const { data, error } = await sb.functions.invoke("create-payment", { body: { paket_id: sel, voucher: box().querySelector("#jn-v").value } });
      if (error || data?.error) { msg(data?.error || "Gagal membuat transaksi. Coba lagi.", true); btn.disabled = false; return; }
      if (data.free) return afterLogin(resolve);
      await loadSnap();
      window.snap.pay(data.token, {
        onSuccess: () => waitActive(resolve, msg),
        onPending: () => { msg("Menunggu pembayaran. Halaman ini otomatis terbuka begitu pembayaran diterima."); waitActive(resolve, msg, 600); },
        onError: () => { msg("Pembayaran gagal. Coba lagi.", true); btn.disabled = false; },
        onClose: () => { btn.disabled = false; },
      });
    };
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
    if (profile?.is_admin && cfg.adminUrl !== false) { location.href = cfg.adminUrl || "admin.html"; return; }
    if (isActive(profile)) { unmount(); resolve({ user, profile }); return; }
    showPaywall(resolve, user);
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
