
(() => {
  if (typeof window.read !== "function") window.read = (k)=>JSON.parse(localStorage.getItem(k)||"null");
  if (typeof window.write !== "function") window.write = (k,v)=>localStorage.setItem(k, JSON.stringify(v));

  const TABLES = {
    trucks:   ["id","plate","make","year","notes"],
    trailers: ["id","plate","type","year","notes"],
    expenses: ["id","date","category","amount","notes"],
    repairs:  ["id","date","shop","cost","notes"],
    invoices: ["id","number","customer","amount","status"]
  };

  const state = { table:"trucks", rows:[], filtered:[] };
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const setStatus = (t) => { const el=$("#status"); if(el) el.textContent = t; };

  async function apiGet(table){
    const r = await fetch(`/api/tables/${table}`, { cache:"no-store" });
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }
  async function apiPut(table, arr){
    const r = await fetch(`/api/tables/${table}`, {
      method:"PUT", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(Array.isArray(arr)?arr:[])
    });
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  }

  function inferColumns(rows, fallback){
    if(!rows || !rows.length) return fallback;
    const keys = new Set();
    rows.forEach(r => Object.keys(r||{}).forEach(k => keys.add(k)));
    const base = TABLES[state.table] || [];
    const others = [...keys].filter(k => !base.includes(k));
    return [...base, ...others];
  }

  function renderHeader(cols){
    $("#thead").innerHTML = `<tr>${cols.map(c=>`<th>${c}</th>`).join("")}<th>Actions</th></tr>`;
  }
  function renderRows(cols, rows){
    if(!rows.length){
      $("#tbody").innerHTML = `<tr><td colspan="${cols.length+1}">No data</td></tr>`;
      return;
    }
    $("#tbody").innerHTML = rows.map(r => {
      const cells = cols.map(c => `<td>${escapeHTML(valueOf(r[c]))}</td>`).join("");
      return `<tr data-id="${escapeHTML(pkOf(r))}">${cells}
        <td class="row-actions">
          <button class="btn" data-act="edit">Edit</button>
          <button class="btn" data-act="del">Delete</button>
        </td></tr>`;
    }).join("");
  }

  function escapeHTML(s){
    s = valueOf(s);
    return String(s).replace(/[&<>"]/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[ch]));
  }
  function valueOf(v){
    if(v==null) return "";
    if(typeof v === "object") return JSON.stringify(v);
    return v;
  }
  function pkOf(row){
    if(!row) return "";
    return row.id ?? row.unit ?? row.number ?? row.plate ?? sha1(JSON.stringify(row));
  }
  function sha1(str){
    let h = 0x811c9dc5;
    for (let i=0;i<str.length;i++) { h ^= str.charCodeAt(i); h = (h*16777619) >>> 0; }
    return "h"+h.toString(16);
  }

  function applyFilter(){
    const q = ($("#search")?.value || "").trim().toLowerCase();
    if(!q){ state.filtered = state.rows.slice(); return }
    state.filtered = state.rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
  }

  function redraw(){
    const cols = inferColumns(state.rows, TABLES[state.table]||["id"]);
    renderHeader(cols);
    renderRows(cols, state.filtered);
  }

  async function load(){
    try{
      setStatus("loading…");
      const rows = await apiGet(state.table);
      state.rows = Array.isArray(rows)? rows : [];
      applyFilter();
      redraw();
      setStatus("ready");
      window.write(`tms:${state.table}`, state.rows);
    }catch(e){ setStatus("error: "+e) }
  }

  async function upsert(){
    const base = { id: ($("#f_id")?.value || "").trim() };
    const A = ($("#f_a")?.value || "").trim();
    const B = ($("#f_b")?.value || "").trim();
    const C = ($("#f_c")?.value || "").trim();
    let row = { ...base };

    if(state.table === "trucks"){ row.plate=A; row.make=B; row.year=Number(C)||C }
    if(state.table === "trailers"){ row.plate=A; row.type=B; row.year=Number(C)||C }
    if(state.table === "expenses"){ row.date=A; row.category=B; row.amount=Number(C)||C }
    if(state.table === "repairs"){ row.date=A; row.shop=B; row.cost=Number(C)||C }
    if(state.table === "invoices"){ row.number=A; row.customer=B; row.amount=Number(C)||C }

    try{
      setStatus("saving…");
      await apiPut(state.table, [row]);
      await load();
      ["f_id","f_a","f_b","f_c"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
      setStatus("saved");
      setTimeout(()=>setStatus("ready"), 800);
    }catch(e){ setStatus("error: "+e) }
  }

  async function remove(id){
    const remain = state.rows.filter(r => pkOf(r) !== id);
    try{
      setStatus("deleting…");
      await apiPut(state.table, remain);
      await load();
      setStatus("deleted");
      setTimeout(()=>setStatus("ready"), 800);
    }catch(e){ setStatus("error: "+e) }
  }

  function editToForm(id){
    const row = state.rows.find(r => pkOf(r)===id);
    if(!row) return;
    const set=(i,v)=>{const el=document.getElementById(i); if(el) el.value=v??"";}
    set("f_id", row.id ?? row.number ?? row.plate ?? "");
    if(state.table === "trucks"){ set("f_a",row.plate); set("f_b",row.make); set("f_c",row.year) }
    if(state.table === "trailers"){ set("f_a",row.plate); set("f_b",row.type); set("f_c",row.year) }
    if(state.table === "expenses"){ set("f_a",row.date); set("f_b",row.category); set("f_c",row.amount) }
    if(state.table === "repairs"){ set("f_a",row.date); set("f_b",row.shop); set("f_c",row.cost) }
    if(state.table === "invoices"){ set("f_a",row.number); set("f_b",row.customer); set("f_c",row.amount) }
  }

  document.getElementById("tabs")?.addEventListener("click", (e)=>{
    const btn = e.target.closest(".tab"); if(!btn) return;
    $$(".tab").forEach(t=>t.classList.remove("active"));
    btn.classList.add("active");
    state.table = btn.dataset.table;
    load();
  });
  document.getElementById("refresh")?.addEventListener("click", load);
  document.getElementById("search")?.addEventListener("input", ()=>{ applyFilter(); redraw() });
  document.getElementById("add")?.addEventListener("click", upsert);
  document.getElementById("tbody")?.addEventListener("click", (e)=>{
    const tr = e.target.closest("tr"); if(!tr) return;
    const id = tr.dataset.id;
    if(e.target.dataset.act==="edit") editToForm(id);
    if(e.target.dataset.act==="del") remove(id);
  });

  setInterval(load, 60*1000);
  load();
})();
