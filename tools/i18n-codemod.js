/* Geliştirme aracı: koddaki Türkçe metinleri tx("...") içine alır.
   Tarayıcıda, tools/devserve.ps1 ile açılan yerel sunucuda çalışır
   (http://localhost:8766/starboard-site/ açıkken konsoldan ya da <script> ile yüklenir).

   I18N.runPass(pass, files, dry)
     pass "A": HTML şablonlarındaki metin düğümleri ve placeholder/aria-label/title/alt değerleri
     pass "B": HTML içermeyen şablon metinleri  `${n} tarif`  ->  tx("{0} tarif", [(n)])
     pass "C": tırnak içindeki metinler  "Kaydet"  ->  tx("Kaydet")
   I18N.verify()        Türkçe çıktının I18N.baseline() ile alınan kayıtla aynı olduğunu sınar
   I18N.verify("en")    İngilizce modda ekranları çizer, sözlükte eksik kalan metinleri döndürür
   I18N.keys(files)     dosyalardaki tx() anahtarlarını listeler

   Türkçede tx() metni aynen döndürdüğü için dönüştürme çıktıyı değiştirmemelidir;
   her aşamadan sonra verify() ile karşılaştırılır. */
(() => {
  const L = "A-Za-zÇĞİÖŞÜçğıöşüâîû";
  const hasWord = new RegExp("[" + L + "]{2,}");
  const TR = /[ÇĞİÖŞÜçğıöşüâîû]/, CAP = /^[^A-Za-zÇĞİÖŞÜçğıöşü]*[A-ZÇĞİÖŞÜ][a-zçğıöşü]/;
  const prose = s => hasWord.test(s) && (TR.test(s) || CAP.test(s));
  const CALLS = /(getElementById|querySelector|querySelectorAll|classList\.\w+|setAttribute|getAttribute|addEventListener|removeEventListener|createElement|createElementNS|closest|matches|getItem|setItem|removeItem|includes|startsWith|endsWith|indexOf|split|join|test|match|replace|localeCompare|toLocale\w+|RegExp|\btx)\(\s*$/;
  const CMP = /(===|!==|==|!=)\s*$/;

  function tokenize(src){
    const n = src.length; let i = 0; const tpls = [], lits = [];
    const st = [{ k:"code", depth:0 }]; let prev = "", prevWord = "";
    const regexOK = () => prev === "" || "(,=:[!&|?{};+-*%<>~^".includes(prev) || /^(return|typeof|case|in|of|void|delete)$/.test(prevWord);
    while (i < n){
      const top = st[st.length - 1], c = src[i], d = src[i + 1];
      if (top.k === "code"){
        if (c === "/" && d === "/"){ const e = src.indexOf("\n", i); i = e < 0 ? n : e; continue; }
        if (c === "/" && d === "*"){ const e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
        if (c === '"' || c === "'"){
          let j = i + 1; while (j < n && src[j] !== c){ if (src[j] === "\\") j++; j++; }
          let k = j + 1; while (k < n && /\s/.test(src[k])) k++;
          lits.push({ a:i, b:j + 1, s:src.slice(i + 1, j), prev, prevWord, before:src.slice(Math.max(0, i - 48), i), next:src[k], next3:src.slice(k, k + 3) });
          i = j + 1; prev = '"'; prevWord = ""; continue;
        }
        if (c === "`"){ st.push({ k:"tpl", open:i, start:i + 1, parts:[] }); i++; continue; }
        if (c === "/" && regexOK()){
          let j = i + 1, cls = false;
          while (j < n && (src[j] !== "/" || cls)){ if (src[j] === "\\") j++; else if (src[j] === "[") cls = true; else if (src[j] === "]") cls = false; else if (src[j] === "\n") break; j++; }
          if (src[j] === "/"){ j++; while (/[a-z]/.test(src[j] || "")) j++; i = j; prev = "/"; prevWord = ""; continue; }
        }
        if (c === "{") top.depth++;
        else if (c === "}"){
          if (top.depth === 0 && st.length > 1){ const e = st.pop(); const tp = st[st.length - 1]; tp.parts.push({ e:1, a:e.start, b:i }); tp.start = i + 1; i++; continue; }
          top.depth--;
        }
        if (/\s/.test(c)){ i++; continue; }
        if (/[A-Za-z0-9_$]/.test(c)){ let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++; prevWord = src.slice(i, j); prev = "a"; i = j; continue; }
        prev = c; prevWord = ""; i++;
      } else {
        if (c === "\\"){ i += 2; continue; }
        if (c === "`"){ top.parts.push({ a:top.start, b:i }); tpls.push({ a:top.open, b:i + 1, parts:top.parts }); st.pop(); prev = "`"; prevWord = ""; i++; continue; }
        if (c === "$" && d === "{"){ top.parts.push({ a:top.start, b:i }); st.push({ k:"code", depth:0, start:i + 2 }); prev = ""; prevWord = ""; i += 2; continue; }
        i++;
      }
    }
    return { tpls, lits, ok: st.length === 1 && st[0].depth === 0 };
  }

  const args = ex => "[" + ex.map(e => "(" + e.trim() + ")").join(", ") + "]";

  function editsFor(pass, src, tk){
    const edits = [];
    if (pass === "A"){
      for (const tp of tk.tpls){
        let cur = null;
        for (const p of tp.parts){
          const txt = src.slice(p.a, p.b);
          if (p.e){ if (cur){ if (/[`<>]/.test(txt)) cur = null; else { cur.key += "{" + cur.ex.length + "}"; cur.ex.push(txt); } } continue; }
          let pos = 0;
          if (cur){
            const lt = txt.indexOf("<"), gt = txt.indexOf(">");
            if (lt < 0 && gt < 0){ if (/[{}\\]/.test(txt)) cur = null; else { cur.key += txt; continue; } }
            else if (lt >= 0 && (gt < 0 || lt < gt)){
              const seg = txt.slice(0, lt);
              if (!/[{}\\]/.test(seg)){
                cur.key += seg; const core = cur.key.trim();
                if (cur.ex.length && hasWord.test(core.replace(/\{\d+\}/g, "")) && !core.includes("\n")){
                  const at = cur.key.indexOf(core), lead = cur.key.slice(0, at), trail = cur.key.slice(at + core.length);
                  if (!/\{\d+\}/.test(lead + trail)) edits.push([cur.from, p.a + lt, lead + "${tx(" + JSON.stringify(core) + ", " + args(cur.ex) + ")}" + trail]);
                }
              }
              pos = lt;
            }
            cur = null;
          }
          const re = />([^<>]+)</g; re.lastIndex = pos; let m;
          while ((m = re.exec(txt))){
            re.lastIndex = m.index + m[0].length - 1;
            const T = m[1], core = T.trim();
            if (!core || !hasWord.test(core) || /[\\{}\n]/.test(core)) continue;
            const s0 = p.a + m.index + 1 + T.indexOf(core);
            edits.push([s0, s0 + core.length, "${tx(" + JSON.stringify(core) + ")}"]);
          }
          const ra = /\b(placeholder|aria-label|title|alt)="([^"$<>\\{}]*)"/g;
          while ((m = ra.exec(txt))){
            if (!hasWord.test(m[2])) continue;
            const s0 = p.a + m.index + m[1].length + 2;
            edits.push([s0, s0 + m[2].length, "${tx(" + JSON.stringify(m[2]) + ")}"]);
          }
          const last = txt.lastIndexOf(">");
          if (last >= pos && txt.indexOf("<", last) < 0){ const tail = txt.slice(last + 1); cur = /[{}\\]/.test(tail) ? null : { key:tail, ex:[], from:p.a + last + 1 }; }
        }
      }
    } else if (pass === "B"){
      for (const tp of tk.tpls){
        const before = src.slice(Math.max(0, tp.a - 48), tp.a);
        if (CMP.test(before) || CALLS.test(before)) continue;
        let key = "", ex = [], bad = false;
        for (const p of tp.parts){
          const txt = src.slice(p.a, p.b);
          if (p.e){ if (/`/.test(txt)){ bad = true; break; } key += "{" + ex.length + "}"; ex.push(txt); }
          else { if (/[<>{}\\\n=;]/.test(txt)){ bad = true; break; } key += txt; }
        }
        if (bad || !prose(key.replace(/\{\d+\}/g, " "))) continue;
        edits.push([tp.a, tp.b, ex.length ? "tx(" + JSON.stringify(key) + ", " + args(ex) + ")" : "tx(" + JSON.stringify(key) + ")"]);
      }
    } else if (pass === "C"){
      for (const l of tk.lits){
        if (l.s === "use strict" || /[<>`\\{}]/.test(l.s) || !prose(l.s)) continue;
        if (l.next === ":" && (l.prev === "{" || l.prev === ",")) continue;          /* nesne anahtarı */
        if (CMP.test(l.before) || /^(===|!==|==[^=]|!=[^=])/.test(l.next3)) continue; /* karşılaştırma */
        if (l.prevWord === "case" || /^in\s/.test(l.next3)) continue;
        if (l.prev === "[" && l.next === "]") continue;                               /* dizin */
        if (CALLS.test(l.before)) continue;
        edits.push([l.a, l.b, "tx(" + src.slice(l.a, l.b) + ")"]);
      }
    }
    return edits;
  }

  async function read(f){ return (await fetch("/starboard-site/js/" + f + ".js?c=" + Date.now() + Math.random())).text(); }

  async function runPass(pass, files, dry){
    const report = {}, problems = [];
    for (const f of files){
      const src = await read(f);
      const tk = tokenize(src);
      if (!tk.ok){ problems.push(f + ": ayrıştırılamadı"); continue; }
      const edits = editsFor(pass, src, tk).sort((x, y) => y[0] - x[0]);
      let out = src, lastStart = Infinity, applied = 0;
      for (const [a, b, rep] of edits){
        if (b > lastStart){ problems.push(f + ": çakışan düzenleme, konum " + a); continue; }
        out = out.slice(0, a) + rep + out.slice(b); lastStart = a; applied++;
      }
      report[f] = applied;
      if (!dry && out !== src){
        if (!tokenize(out).ok){ problems.push(f + ": çıktı ayrıştırılamadı, yazılmadı"); continue; }
        const r = await fetch("/__write/" + f + ".js", { method:"PUT", body:out });
        if (r.status !== 204) problems.push(f + ": yazılamadı (" + r.status + ")");
      }
    }
    return { pass, dry:!!dry, report, total:Object.values(report).reduce((a, b) => a + b, 0), problems };
  }

  async function keys(files){
    const out = [];
    for (const f of files){
      const src = await read(f);
      const re = /\btx\(("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g; let m;
      while ((m = re.exec(src))){
        try { const k = m[1][0] === '"' ? JSON.parse(m[1]) : m[1].slice(1, -1); if (!out.includes(k)) out.push(k); } catch(e){}
      }
    }
    return out;
  }

  /* Bütün sekmeleri, alt sekmeleri ve giriş adımlarını çizip HTML'lerini toplar. Uygulamanın içinde çalışır. */
  const SNAP = "(() => { const out = {}; notice = null; viewDate = null; const saved = state;"
    + " for (const t of ['today','calendar','settings']) { tab = t; render(); out[t] = app.innerHTML; }"
    + " for (const pt of ['today','program']) { tab = 'plan'; planTab = pt; render(); out['plan-'+pt] = app.innerHTML; }"
    + " for (const mt of ['log','plan','recipes']) { tab = 'meals'; mealTab = mt; render(); out['meals-'+mt] = app.innerHTML; }"
    + " state = null; ob = obDefaults(); ob.sex = 'male'; ob.avatar = 'm'; ob.avColor = '#2F7BEA';"
    + " for (let i = 0; i < OB_STEPS.length; i++) { obStep = i; render(); out['ob'+i] = app.innerHTML; }"
    + " state = saved; ob = null; obStep = 0; tab = 'today'; planTab = 'today'; mealTab = 'log'; render(); return out; })()";

  async function snapshot(lang){
    const fr = document.createElement("iframe");
    fr.style.cssText = "position:fixed;left:-9999px;width:800px;height:700px";
    if (lang) localStorage.setItem("starboard-lang", lang); else localStorage.removeItem("starboard-lang");
    fr.src = "/starboard-site/index.html?v=" + Date.now(); document.body.appendChild(fr);
    await new Promise(r => fr.onload = r);
    await new Promise(r => setTimeout(r, 800));
    const w = fr.contentWindow; let snap = null, err = null, missing = [];
    try { snap = w.eval(SNAP); } catch(e){ err = e.message; }
    try { missing = w.eval("[...I18N_MISSING]"); } catch(e){}
    localStorage.removeItem("starboard-lang");
    fr.remove();
    return { snap, err, missing };
  }

  async function baseline(){
    const { snap, err } = await snapshot();
    if (err) return { err };
    localStorage.setItem("snap-i18n", JSON.stringify(snap));
    return { views:Object.keys(snap).length };
  }

  async function verify(lang){
    const { snap, err, missing } = await snapshot(lang);
    if (err) return { err };
    if (lang) return { views:Object.keys(snap).length, missing };
    const old = JSON.parse(localStorage.getItem("snap-i18n") || "{}"), diff = {};
    for (const k in old) if (old[k] !== snap[k]){
      let i = 0; while (old[k][i] === snap[k][i]) i++;
      diff[k] = { at:i, old:old[k].slice(Math.max(0, i - 50), i + 70), neu:snap[k].slice(Math.max(0, i - 50), i + 70) };
    }
    return { same:!Object.keys(diff).length, ndiff:Object.keys(diff).length, diff:Object.fromEntries(Object.entries(diff).slice(0, 4)) };
  }

  /* İngilizce modda ekranda kalan Türkçe karakterli metinleri listeler. */
  async function leftovers(){
    const { snap, err } = await snapshot("en");
    if (err) return { err };
    const found = new Set();
    for (const html of Object.values(snap)){
      const d = new DOMParser().parseFromString(html, "text/html");
      const w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())){ const s = n.textContent.trim(); if (s && TR.test(s)) found.add(s); }
    }
    return [...found];
  }

  window.I18NTOOL = { tokenize, runPass, keys, baseline, verify, leftovers };
})();
