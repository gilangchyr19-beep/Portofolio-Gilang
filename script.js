(function () {
  "use strict";
  var d = document;
  d.documentElement.classList.add("js");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("#year").textContent = new Date().getFullYear();

  /* ---------- teks PORTFOLIO menyesuaikan lebar ---------- */
  var giant = $("#giant"), hero = $(".hero");
  function fitGiant() {
    if (!giant || !hero) return;
    giant.style.fontSize = "100px";
    var avail = hero.clientWidth - (window.innerWidth > 860 ? 8 : 28);
    var w = giant.scrollWidth || 1;
    var size = Math.min(100 * avail / w, 340);
    giant.style.fontSize = size.toFixed(1) + "px";
    hero.style.setProperty("--giant", size.toFixed(1) + "px");
  }
  fitGiant();
  window.addEventListener("resize", fitGiant);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fitGiant);
  window.addEventListener("load", fitGiant);

  /* ---------- topbar, progress, link aktif, parallax ---------- */
  var topbar = $("#topbar"), bar = $("#progress");
  var links = $$("#menu a");
  var secs = links.map(function (a) { return $(a.getAttribute("href")); });
  function onScroll() {
    var y = window.scrollY || 0;
    topbar.classList.toggle("scrolled", y > 20);
    var h = d.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? y / h * 100 : 0) + "%";
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= 140) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
    if (!reduce && y < window.innerHeight) {
      giant.style.transform = "translate(-50%," + (y * 0.12).toFixed(1) + "px)";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- menu mobile ---------- */
  var burger = $("#burger"), menu = $("#menu");
  function closeMenu() {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Buka menu");
  }
  burger.addEventListener("click", function () {
    var o = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(o));
    burger.setAttribute("aria-label", o ? "Tutup menu" : "Buka menu");
  });
  links.forEach(function (a) { a.addEventListener("click", closeMenu); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- reveal ---------- */
  var rv = $$(".reveal");
  rv.forEach(function (el) {
    var sibs = $$(".reveal", el.parentElement).filter(function (c) { return c.parentElement === el.parentElement; });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 0.09 + "s");
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- hitung angka ---------- */
  $$("[data-count]").forEach(function (el) {
    var t = +el.dataset.count, sfx = el.dataset.suffix || "";
    if (reduce) { el.textContent = t + sfx; return; }
    var go = function () {
      var s = null;
      (function step(ts) {
        if (s === null) s = ts;
        var p = Math.min((ts - s) / 1300, 1);
        el.textContent = Math.round(t * (1 - Math.pow(1 - p, 3))) + (p === 1 ? sfx : "");
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    };
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); go(); } });
    o.observe(el);
  });

  /* ---------- util ---------- */
  var fmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
  function rp(n) { return "Rp " + fmt.format(n); }

  /* ---------- playground: tab ---------- */
  var tabs = $$('.tabs [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") n = tabs[0];
      if (e.key === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ---------- demo 1: presensi ---------- */
  var att = [
    ["Siswa 1", [0, 1, 1, 1]], ["Siswa 2", [1, 1, 1, 1]], ["Siswa 3", [0, 0, 1, 1]],
    ["Siswa 4", [1, 0, 0, 0]], ["Siswa 5", [1, 1, 1, 0]], ["Siswa 6", [1, 1, 1, 1]]
  ];
  var attBody = $("#att-body");
  att.forEach(function (r, ri) {
    var tr = d.createElement("tr");
    var h = "<td>" + r[0] + "</td>";
    r[1].forEach(function (v, ci) {
      h += '<td><input type="checkbox" data-r="' + ri + '" data-c="' + ci + '" aria-label="' + r[0] + ", pertemuan " + (ci + 1) + '"' + (v ? " checked" : "") + "></td>";
    });
    h += '<td><div class="bar"><i></i><span></span></div></td><td><span class="tag"></span></td>';
    tr.innerHTML = h;
    attBody.appendChild(tr);
  });
  function calcAtt() {
    var rows = $$("tr", attBody), sum = 0, full = 0, low = 0;
    rows.forEach(function (tr) {
      var n = $$("input:checked", tr).length, pct = n / 4;
      sum += pct;
      if (n === 4) full++;
      var tag = $(".tag", tr), st;
      if (pct >= 0.75) { st = ["Baik", "ok"]; } else if (pct >= 0.5) { st = ["Cukup", "mid"]; } else { st = ["Perlu tindak lanjut", "low"]; low++; }
      tag.textContent = st[0]; tag.className = "tag " + st[1];
      $(".bar i", tr).style.width = (pct * 100 * 0.9) + "px";
      $(".bar span", tr).textContent = Math.round(pct * 100) + "%";
    });
    $("#att-avg").textContent = Math.round(sum / rows.length * 100) + "%";
    $("#att-full").textContent = full + " siswa";
    $("#att-low").textContent = low + " siswa";
  }
  attBody.addEventListener("change", calcAtt);
  calcAtt();

  /* ---------- demo 2: lookup ---------- */
  var stu = [
    ["A001", "Andi", "A", "IPA"], ["A002", "Budi", "C", "IPS"], ["A003", "Cindy", "C", "IPA"],
    ["A004", "Dewi", "B", "Bahasa"], ["A005", "Endah", "B", "IPS"], ["A006", "Firman", "A", "Bahasa"],
    ["A007", "Galih", "C", "Bahasa"], ["A008", "Hilman", "B", "IPA"], ["A009", "Indra", "A", "IPS"]
  ];
  var lkCode = $("#lk-code"), lkCol = $("#lk-col"), lkTable = $("#lk-table"), method = "v";
  stu.forEach(function (s) { var o = d.createElement("option"); o.value = s[0]; o.textContent = s[0]; lkCode.appendChild(o); });
  lkCode.value = "A004";
  var colNames = ["Kode", "Nama", "Kelas", "Jurusan"], letters = ["A", "B", "C", "D"];
  var why = {
    v: "VLOOKUP mencari kode di kolom paling kiri, lalu turun ke bawah dan mengambil isi kolom ke-n. Praktis, tapi kolom kunci harus paling kiri.",
    h: "HLOOKUP sama logikanya, tetapi untuk tabel yang disusun mendatar: kode dicari di baris paling atas, lalu turun ke baris ke-n.",
    i: "MATCH mencari posisi kode, INDEX mengambil isi pada posisi itu. Kolom kunci boleh di mana saja, jadi lebih tahan kalau susunan tabel berubah."
  };
  function renderLookup() {
    var code = lkCode.value, ci = +lkCol.value;
    var idx = stu.findIndex(function (s) { return s[0] === code; });
    var row = stu[idx], res = row[ci];
    var h = "";
    if (method === "h") {
      for (var r = 0; r < 4; r++) {
        h += "<tr><th>" + colNames[r] + "</th>";
        stu.forEach(function (s, si) {
          var on = si === idx;
          h += "<td" + (on ? ' class="' + (r === ci ? "hl" : "") + '" style="background:rgba(211,21,28,' + (r === ci ? ".35" : ".16") + ')"' : "") + ">" + s[r] + "</td>";
        });
        h += "</tr>";
      }
    } else {
      h += "<thead><tr>" + colNames.map(function (c, k) { return "<th>" + c + " (" + letters[k] + ")</th>"; }).join("") + "</tr></thead><tbody>";
      stu.forEach(function (s, si) {
        h += '<tr class="' + (si === idx ? "hl" : "") + '">' + s.map(function (v, k) {
          return "<td" + (si === idx && k === ci + 0 ? ' class="hl"' : "") + ">" + v + "</td>";
        }).join("") + "</tr>";
      });
      h += "</tbody>";
    }
    lkTable.innerHTML = h;
    $("#lk-result").textContent = res;
    $("#lk-why").textContent = why[method];
    var n = ci + 1, f;
    if (method === "v") f = '=VLOOKUP("' + code + '";A2:D10;' + n + ";FALSE)";
    else if (method === "h") f = '=HLOOKUP("' + code + '";B2:J5;' + n + ";FALSE)";
    else f = "=INDEX(" + letters[ci] + "2:" + letters[ci] + '10;MATCH("' + code + '";A2:A10;0))';
    $("#lk-formula").textContent = f;
  }
  lkCode.addEventListener("change", renderLookup);
  lkCol.addEventListener("change", renderLookup);
  $$("#lk-method button").forEach(function (b) {
    b.addEventListener("click", function () {
      method = b.dataset.m;
      $$("#lk-method button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      renderLookup();
    });
  });
  renderLookup();

  /* ---------- demo 3: IF / IFS ---------- */
  var range = $("#ifs-range");
  function renderIfs() {
    var v = +range.value, g = v >= 90 ? "A" : v >= 80 ? "B" : v >= 70 ? "C" : v >= 60 ? "D" : "E";
    $("#ifs-val").textContent = v;
    var el = $("#ifs-grade");
    el.textContent = g;
    var good = g === "A" || g === "B" || g === "C";
    el.style.background = good ? "rgba(211,21,28,.2)" : "transparent";
    el.style.color = good ? "#ff8d91" : "#a89f9f";
    el.style.borderColor = good ? "#d3151c" : "#6b5f5f";
    $("#ifs-note").textContent = "Nilai " + v + " mendapat predikat " + g + ", dan dinyatakan " + (v >= 70 ? "Tuntas" : "Remedial") + " (batas tuntas 70).";
  }
  range.addEventListener("input", renderIfs);
  renderIfs();

  /* ---------- demo 4: teks ---------- */
  var txIn = $("#tx-in");
  function proper(s) { return s.toLowerCase().replace(/(^|[^a-z0-9À-ɏ])([a-zà-ɏ])/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  function renderTx() {
    var v = txIn.value;
    $("#tx-proper").textContent = v ? proper(v) : "-";
    $("#tx-upper").textContent = v ? v.toUpperCase() : "-";
    $("#tx-lower").textContent = v ? v.toLowerCase() : "-";
    $("#tx-len").textContent = v.length;
  }
  txIn.addEventListener("input", renderTx);
  renderTx();

  /* ---------- demo 5: statistik ---------- */
  var stIn = $("#st-in");
  function renderSt() {
    var nums = stIn.value.split(/[\s,;]+/).map(function (x) { return x.replace(/\./g, ""); }).filter(function (x) { return x !== "" && !isNaN(+x); }).map(Number);
    var set = function (id, v) { $(id).textContent = v; };
    if (!nums.length) { ["#st-sum", "#st-avg", "#st-cnt", "#st-max", "#st-min"].forEach(function (i) { set(i, "-"); }); return; }
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    set("#st-sum", rp(sum));
    set("#st-avg", rp(sum / nums.length));
    set("#st-cnt", nums.length);
    set("#st-max", rp(Math.max.apply(null, nums)));
    set("#st-min", rp(Math.min.apply(null, nums)));
  }
  stIn.addEventListener("input", renderSt);
  renderSt();

  /* ---------- studi kasus (modal) ---------- */
  var cases = {
    presensi: {
      img: "img/excel-2.jpg", alt: "Tabel rekap kehadiran PJOK",
      kicker: "Excel · Conditional formatting", title: "Rekap Kehadiran PJOK",
      konteks: "Kelas MIPA 5 dengan 25 siswa. Pelajaran olahraga seminggu sekali, jadi satu bulan terdiri dari 4 pertemuan.",
      masalah: "Rekap absen manual memakan waktu dan gampang salah hitung, apalagi saat guru atau wali kelas meminta ringkasan di akhir bulan.",
      langkah: [
        "Satu baris per siswa dan satu kolom per pertemuan, diisi dengan centang.",
        "Persentase kehadiran dihitung otomatis dari jumlah centang.",
        "Bar persentase (data bar) membuat siswa yang jarang hadir langsung terlihat tanpa membaca angka satu per satu.",
        "Kolom nama siswa saya buramkan di versi publik ini demi privasi."
      ],
      rumus: "=COUNTIF(D6:G6;TRUE)/4",
      hasil: "Rekap bulanan terbaca sekali lihat: kehadiran 25%, 50%, 75%, atau 100% tampak dari panjang bar-nya.",
      belajar: "Struktur data yang konsisten sejak awal membuat rumusnya jadi sederhana dan jarang salah.",
      cta: ["Coba versi interaktif", "presensi"]
    },
    lookup: {
      img: "img/excel-3.jpg", alt: "Tabel latihan lookup data siswa",
      kicker: "Excel · Lookup", title: "Pencarian Data Siswa",
      konteks: "Latihan dari modul MySkill: tabel kode siswa berisi nama, kelas, dan jurusan, lalu dicari dengan tiga cara berbeda.",
      masalah: "Mencari data satu per satu di tabel yang panjang itu lambat dan rawan salah baca.",
      langkah: [
        "VLOOKUP untuk mencari ke bawah pada kolom pertama tabel.",
        "HLOOKUP untuk tabel yang disusun mendatar (baris).",
        "INDEX & MATCH saat kolom kunci tidak harus berada di paling kiri atau susunan kolom bisa berubah."
      ],
      rumus: '=INDEX(B2:B10;MATCH("A004";A2:A10;0))',
      hasil: "Satu kode siswa langsung menghasilkan nama, kelas, dan jurusannya, dan saya jadi paham kapan memilih rumus yang mana.",
      belajar: "VLOOKUP paling mudah dipelajari, tetapi INDEX & MATCH lebih tahan terhadap perubahan susunan kolom.",
      cta: ["Coba lookup interaktif", "lookup"]
    },
    statistik: {
      img: "img/excel-1.jpg", alt: "Tabel statistik produk dan latihan fungsi teks",
      kicker: "Excel · Fungsi dasar", title: "Statistik & Rapikan Teks",
      konteks: "Tabel 10 produk dengan total, rata-rata stok, jumlah data, nilai tertinggi, dan terendah, ditambah latihan merapikan teks.",
      masalah: "Angka dihitung manual, dan teks hasil input sering tidak seragam karena huruf besar-kecilnya acak.",
      langkah: [
        "SUM, AVERAGE, COUNT/COUNTA, MAX, dan MIN untuk meringkas angka.",
        "PROPER, UPPER, LOWER, dan CONCAT untuk menyeragamkan teks, misalnya \"jANgan MerokOK\" menjadi \"Jangan Merokok\"."
      ],
      rumus: "=PROPER(A2)",
      hasil: "Total Rp 11.100.000 dari 10 baris data langsung terhitung dan mudah dicek ulang.",
      belajar: "COUNT hanya menghitung angka, sedangkan COUNTA menghitung semua sel terisi. Salah memilih bisa membuat jumlah data keliru.",
      cta: ["Coba statistik interaktif", "stat"]
    }
  };
  var dlg = $("#case"), body = $("#case-body"), caseOpener = null;
  function openCase(key, opener) {
    var c = cases[key]; if (!c) return;
    caseOpener = opener;
    body.innerHTML =
      '<div class="case-img"><img src="' + c.img + '" alt="' + c.alt + '"></div>' +
      '<div class="case-txt"><span class="kicker">' + c.kicker + '</span><h3 id="case-title">' + c.title + "</h3>" +
      "<h4>Konteks</h4><p>" + c.konteks + "</p><h4>Masalah</h4><p>" + c.masalah + "</p>" +
      "<h4>Pendekatan</h4><ul>" + c.langkah.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" +
      "<h4>Contoh rumus</h4><code class=\"formula\"></code>" +
      "<h4>Hasil</h4><p>" + c.hasil + "</p><h4>Yang saya pelajari</h4><p>" + c.belajar + "</p>" +
      '<div class="case-cta"><button class="btn solid" data-go="' + c.cta[1] + '">' + c.cta[0] + ' <svg class="ic"><use href="#i-arrow"/></svg></button></div></div>';
    $(".formula", body).textContent = c.rumus;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    $(".case-txt", body).scrollTop = 0;
  }
  $$(".pcard").forEach(function (b) { b.addEventListener("click", function () { openCase(b.dataset.case, b); }); });
  function closeCase() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  $("#case-close").addEventListener("click", closeCase);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeCase(); });
  dlg.addEventListener("close", function () { if (caseOpener) caseOpener.focus(); });
  body.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]"); if (!b) return;
    var t = $("#tab-" + b.dataset.go);
    closeCase();
    selectTab(t);
    $("#playground").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  /* ---------- lightbox ---------- */
  var lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap"), last = null;
  function openLb(b) {
    last = b; lbImg.src = b.dataset.src;
    var im = $("img", b); lbImg.alt = im ? im.alt : "";
    lbCap.textContent = b.dataset.cap || "";
    lb.hidden = false; d.body.style.overflow = "hidden"; $("#lbClose").focus();
  }
  function closeLb() { lb.hidden = true; lbImg.removeAttribute("src"); d.body.style.overflow = ""; if (last) last.focus(); }
  $$(".zoom").forEach(function (b) { b.addEventListener("click", function () { openLb(b); }); });
  $("#lbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  /* ---------- demo 6: validasi data ---------- */
  var vdIn = $("#vd-in"), vdBody = $("#vd-body");
  function cell(tr, text, cls) { var td = d.createElement("td"); td.textContent = text; if (cls) td.className = cls; tr.appendChild(td); return td; }
  function tagEl(txt, kind) { var s = d.createElement("span"); s.className = "tag " + kind; s.textContent = txt; return s; }
  function renderVd() {
    var lines = vdIn.value.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
    var seen = {}, ok = 0, bad = 0, dup = 0;
    vdBody.textContent = "";
    lines.forEach(function (line, i) {
      var parts = line.split(";").map(function (x) { return x.trim(); });
      var nama = parts[0] || "", hp = parts[1] || "", mail = parts[2] || "";
      var issues = [], fixed = false;
      var hpClean = hp.replace(/[\s\-().+]/g, "");
      if (hpClean !== hp.replace(/\s/g, "") || /\s/.test(hp)) fixed = hp !== hpClean;
      if (!nama) issues.push("Nama kosong");
      if (!/^(08\d{8,11}|628\d{8,11})$/.test(hpClean)) issues.push("No HP tidak valid");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) issues.push("Email tidak valid");
      var key = nama.toLowerCase() + "|" + hpClean;
      var isDup = !!nama && seen[key];
      if (isDup) { issues.push("Data ganda"); dup++; }
      seen[key] = true;
      var tr = d.createElement("tr");
      if (issues.length) { tr.className = "bad-row"; bad++; } else { ok++; }
      cell(tr, String(i + 1));
      cell(tr, nama || "(kosong)", nama ? "" : "muted");
      cell(tr, hpClean || "-");
      cell(tr, mail || "-");
      var td = d.createElement("td");
      if (issues.length) issues.forEach(function (x) { td.appendChild(tagEl(x, "low")); td.appendChild(d.createTextNode(" ")); });
      else { td.appendChild(tagEl("Valid", "ok")); if (fixed) { td.appendChild(d.createTextNode(" ")); td.appendChild(tagEl("Format dirapikan", "mid")); } }
      tr.appendChild(td);
      vdBody.appendChild(tr);
    });
    $("#vd-total").textContent = lines.length;
    $("#vd-ok").textContent = ok;
    $("#vd-bad").textContent = bad;
    $("#vd-dup").textContent = dup;
  }
  vdIn.addEventListener("input", renderVd);
  renderVd();

  /* ---------- demo 7: balasan customer service ---------- */
  var csCase = $("#cs-case"), csName = $("#cs-name"), csSteps = $("#cs-steps"), csMsg = $("#cs-msg"), csTone = "formal";
  var csData = {
    telat: {
      empati: "Mohon maaf atas keterlambatan pesanan Anda. Kami memahami hal ini membuat Anda menunggu dan kurang nyaman.",
      solusi: "Kami akan segera mengecek status pengiriman ke bagian terkait dan menyampaikan perkiraan tiba yang terbaru.",
      lanjut: "Kami kabari paling lambat 1 x 24 jam. Agar pengecekan lebih cepat, mohon kirimkan nomor pesanan Anda."
    },
    salah: {
      empati: "Mohon maaf barang yang Anda terima tidak sesuai dengan pesanan. Kami paham ini tentu mengecewakan.",
      solusi: "Untuk proses penukaran atau pengembalian, mohon kirimkan foto barang beserta label pengiriman.",
      lanjut: "Setelah foto dan nomor pesanan kami terima, kami langsung memproses dan memberi kabar perkembangannya."
    },
    info: {
      empati: "Senang bisa membantu pertanyaan Anda.",
      solusi: "Sebagai contoh, layanan kami buka Senin sampai Jumat pukul 08.00 sampai 17.00 WIB, dan Sabtu pukul 08.00 sampai 13.00 WIB.",
      lanjut: "Bila ada hal lain yang ingin ditanyakan, silakan balas pesan ini dan kami siap membantu."
    },
    data: {
      empati: "Baik, kami bantu proses permintaan data Anda.",
      solusi: "Mohon lengkapi nama lengkap, nomor pesanan atau akun, serta dokumen pendukung yang diminta.",
      lanjut: "Data yang masuk akan kami periksa lebih dulu, lalu hasilnya kami konfirmasikan kepada Anda."
    }
  };
  function csGreeting() {
    var hr = new Date().getHours();
    return hr < 11 ? "pagi" : hr < 15 ? "siang" : hr < 18 ? "sore" : "malam";
  }
  function santai(t) {
    return t.replace(/Anda/g, "Kakak").replace(/Mohon maaf/g, "Mohon maaf ya").replace(/mohon kirimkan/gi, function (m) { return m.charAt(0) === "M" ? "Tolong kirimkan" : "tolong kirimkan"; }).replace(/mohon lengkapi/gi, function (m) { return m.charAt(0) === "M" ? "Tolong lengkapi" : "tolong lengkapi"; });
  }
  function renderCs() {
    var c = csData[csCase.value], nm = (csName.value || "").trim() || "Pelanggan";
    var sapa, penutup, e = c.empati, s = c.solusi, l = c.lanjut;
    if (csTone === "formal") {
      sapa = "Selamat " + csGreeting() + ", Bapak/Ibu " + nm + ". Terima kasih telah menghubungi kami.";
      penutup = "Hormat kami,\nGilang";
    } else {
      sapa = "Halo, Kak " + nm + "! Terima kasih sudah menghubungi kami ya.";
      penutup = "Salam hangat,\nGilang";
      e = santai(e); s = santai(s); l = santai(l);
    }
    var steps = [["Sapa", sapa], ["Empati", e], ["Solusi", s], ["Tindak lanjut", l]];
    csSteps.textContent = "";
    steps.forEach(function (st, i) {
      var li = d.createElement("li");
      var em = d.createElement("em"); em.textContent = "0" + (i + 1);
      var div = d.createElement("div");
      var b = d.createElement("b"); b.textContent = st[0];
      var p = d.createElement("p"); p.textContent = st[1];
      div.appendChild(b); div.appendChild(p); li.appendChild(em); li.appendChild(div); csSteps.appendChild(li);
    });
    csMsg.textContent = steps.map(function (x) { return x[1]; }).join("\n\n") + "\n\n" + penutup;
  }
  csCase.addEventListener("change", renderCs);
  csName.addEventListener("input", renderCs);
  $$("#cs-tone button").forEach(function (b) {
    b.addEventListener("click", function () {
      csTone = b.dataset.t;
      $$("#cs-tone button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      renderCs();
    });
  });
  $("#cs-copy").addEventListener("click", function () {
    var lab = $("#cs-copy-t");
    function done(t) { lab.textContent = t; setTimeout(function () { lab.textContent = "Salin"; }, 1800); }
    try {
      navigator.clipboard.writeText(csMsg.textContent).then(function () { done("Tersalin"); }, function () { done("Gagal menyalin"); });
    } catch (err) { done("Gagal menyalin"); }
  });
  renderCs();

  /* ---------- tombol "lihat demo" di kartu posisi ---------- */
  $$("[data-demo]").forEach(function (b) {
    b.addEventListener("click", function () {
      selectTab($("#tab-" + b.dataset.demo));
      $("#playground").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
