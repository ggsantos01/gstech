const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "prospecta_web_leads_v1";
const REGIONS_KEY = "prospecta_web_regions_v1";
const LAST_SEARCH_KEY = "prospecta_web_last_search_v1";
const MAX_REGIONS = 10;
let foundBusinesses = [];
let activeFilter = "all";

const segmentConfig = {
  serralheria: { label:"Serralherias", short:"serralheria", selectors:[['craft','welder'],['craft','metal_construction'],['shop','metal_construction']] },
  barbearia: { label:"Barbearias", short:"barbearia", selectors:[['shop','hairdresser'],['hairdresser','barber']] },
  oficina: { label:"Oficinas mecânicas", short:"oficina mecânica", selectors:[['shop','car_repair'],['craft','car_repair'],['amenity','vehicle_inspection']] },
  restaurante: { label:"Restaurantes", short:"restaurante", selectors:[['amenity','restaurant'],['amenity','fast_food']] },
  estetica: { label:"Clínicas de estética e beleza", short:"estética e beleza", selectors:[['shop','beauty'],['beauty','beauty'],['beauty','nails'],['beauty','eyelash'],['beauty','hair_removal'],['beauty','skin_care'],['beauty','tanning'],['shop','hairdresser']] },
  assistencia: { label:"Assistências técnicas", short:"assistência técnica", selectors:[['shop','electronics_repair'],['craft','electronics_repair'],['shop','computer']] },
  mercado: { label:"Mercados e mercearias", short:"mercado", selectors:[['shop','supermarket'],['shop','convenience']] },
  cafe: { label:"Cafeterias", short:"cafeteria", selectors:[['amenity','cafe']] }
};

// ====== REGIÕES: histórico e última busca ======
function getRegions(){ try{const r=JSON.parse(localStorage.getItem(REGIONS_KEY)||"[]");return Array.isArray(r)?r:[]}catch{return []} }
function rememberRegion(city){
  const name=city.trim(); if(!name) return;
  const list=getRegions().filter(x=>x.toLowerCase()!==name.toLowerCase());
  list.unshift(name);
  try{localStorage.setItem(REGIONS_KEY,JSON.stringify(list.slice(0,MAX_REGIONS)))}catch{}
  renderRegions();
}
function rememberSearch(city,segment,radius){
  try{localStorage.setItem(LAST_SEARCH_KEY,JSON.stringify({city,segment,radius}))}catch{}
}
function renderRegions(){
  const list=getRegions();
  $("regionList").innerHTML=list.map(r=>`<option value="${escapeHtml(r)}"></option>`).join("");
  $("regionChips").innerHTML=list.map(r=>`<button type="button" class="chip" data-region="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join("")+(list.length?`<button type="button" class="chip" data-clear-regions="1">Limpar histórico</button>`:"");
  $("regionRecents").hidden=!list.length;
}
function restoreLastSearch(){
  try{
    const last=JSON.parse(localStorage.getItem(LAST_SEARCH_KEY)||"null");
    if(!last) return;
    if(last.city) $("city").value=last.city;
    if(last.segment&&segmentConfig[last.segment]) $("segment").value=last.segment;
    if(last.radius&&[...$("radius").options].some(o=>o.value===String(last.radius))) $("radius").value=String(last.radius);
  }catch{}
}

function getSaved(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []} }
function setSaved(items){ localStorage.setItem(STORAGE_KEY,JSON.stringify(items)); updateStats(); }
function normalizePhone(raw){
  if(!raw) return "";
  let digits=String(raw).replace(/[^\d+]/g,"").replace(/^00/,"+");
  if(digits.startsWith("+")) digits=digits.slice(1);
  if(digits.length===10||digits.length===11) digits="55"+digits;
  return digits;
}
function getPhone(tags){return tags["contact:whatsapp"]||tags["contact:phone"]||tags.phone||tags.mobile||""}
function getWebsite(tags){return tags["contact:website"]||tags.website||""}
function getName(tags){return tags.name||tags.brand||tags.operator||"Estabelecimento sem nome"}
function getAddress(tags){
  const street=tags["addr:street"]||"";
  const number=tags["addr:housenumber"]||"";
  const hood=tags["addr:suburb"]||tags["addr:neighbourhood"]||"";
  const city=tags["addr:city"]||"";
  return [street&&[street,number].filter(Boolean).join(", "),hood,city].filter(Boolean).join(" · ") || "Endereço não cadastrado";
}
function elementCoords(el){return el.lat&&el.lon?{lat:el.lat,lon:el.lon}:el.center?{lat:el.center.lat,lon:el.center.lon}:null}
function toBusiness(el){
  const tags=el.tags||{}, coords=elementCoords(el);
  if(!coords) return null;
  const phoneRaw=getPhone(tags);
  return {id:`${el.type}/${el.id}`,name:getName(tags),address:getAddress(tags),phone:normalizePhone(phoneRaw),phoneRaw,website:getWebsite(tags),lat:coords.lat,lon:coords.lon,tags,segment:segmentConfig[$("segment").value].label,source:"OpenStreetMap"};
}

function isRelevantForSegment(el,segment){
  const tags=el.tags||{};
  if(segment!=="estetica") return true;
  // Evita que clínicas médicas e unidades públicas apareçam como negócios de beleza.
  const medicalKeys=["healthcare","amenity","emergency","public_transport"];
  const medicalValues=new Set(["clinic","hospital","doctors","doctor","health_centre","healthcare","pharmacy","dentist","emergency","social_facility"]);
  for(const key of medicalKeys){
    const value=String(tags[key]||"").toLowerCase();
    if(medicalValues.has(value)) return false;
  }
  if(tags.healthcare && !["beauty"].includes(String(tags.healthcare).toLowerCase())) return false;
  return true;
}

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function mapsUrl(b){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name+" "+b.lat+","+b.lon)}`}
// ====== MENSAGEM AUTOMÁTICA DO WHATSAPP ======
// Coloque seu nome aqui (opcional). Ex.: "João"
const SENDER_NAME = "";
const OPTOUT = "Se preferir não receber mensagens, é só avisar.";
const FOLLOWUP_DAYS = 3; // dias sem resposta para marcar follow-up pendente
function greeting(){
  const h=new Date().getHours();
  return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
}
function buildWhatsAppMessage(b,followup){
  const cfg=Object.values(segmentConfig).find(c=>c.label===b.segment);
  const tipo=cfg?cfg.short:"negócio";
  const hasName=b.name&&b.name!=="Estabelecimento sem nome";
  const quem=SENDER_NAME?`Aqui é ${SENDER_NAME}, da GSTech.`:"Aqui é da GSTech.";
  const alvo=hasName?`a ${b.name}`:`o seu ${tipo}`;
  const gancho=b.website
    ? `Vi o site de vocês e acredito que dá para deixá-lo ainda mais atrativo para trazer novos clientes.`
    : `Pesquisando ${tipo} na região, não encontrei um site de vocês, e hoje isso faz muita diferença para ser encontrado por novos clientes.`;
  const demo=(getSaved().find(x=>x.id===b.id)||{}).demoUrl;
  if(followup){
    const assunto=hasName?`o site da ${b.name}`:`o site do seu ${tipo}`;
    return `${greeting()}! Tudo bem? ${quem}\n\nPassando para retomar nosso contato sobre ${assunto}. ${demo?`Conseguiu dar uma olhada na demonstração? ${demo}`:"Conseguiu pensar no assunto?"}\n\nSe quiser, posso ajustar a ideia ou tirar qualquer dúvida. ${OPTOUT}`;
  }
  const fecho=demo
    ? `Já montei uma demonstração de como poderia ficar: ${demo}\n\nÉ só um exemplo com dados públicos de vocês; se gostar, a gente ajusta tudo com as informações certas. Pode dar uma olhada?`
    : `Posso te mostrar uma ideia de como poderia ficar, sem compromisso?`;
  return `${greeting()}! Tudo bem? ${quem}\n\nEncontrei ${alvo} e queria falar rapidinho com o responsável. ${gancho}\n\n${fecho}\n\n${OPTOUT}`;
}
function waUrl(phone,b,followup){
  if(!phone) return "";
  const text=b?`?text=${encodeURIComponent(buildWhatsAppMessage(b,followup))}`:"";
  return `https://wa.me/${phone}${text}`;
}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
function updateStats(){
  const saved=getSaved();
  $("statFound").textContent=foundBusinesses.length;
  $("statSaved").textContent=saved.length;
  $("statPhone").textContent=foundBusinesses.filter(x=>x.phone).length;
  $("statNoSite").textContent=foundBusinesses.filter(x=>!x.website).length;
}
function buildQuery(lat,lon,radius,selectors){
  const clauses=selectors.map(([k,v])=>`nwr(around:${radius},${lat},${lon})["${k}"="${v}"];`).join("\n");
  return `[out:json][timeout:35];(${clauses});out center tags;`;
}
async function geocode(place){
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(place)}`;
  const response=await fetch(url,{headers:{"Accept-Language":"pt-BR"}});
  if(!response.ok) throw new Error("Não foi possível localizar a cidade. Tente novamente.");
  const data=await response.json();
  if(!data.length) throw new Error("Local não encontrado. Tente informar cidade e estado.");
  return data[0];
}
async function overpass(query){
  const endpoints=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
  let lastError;
  for(const endpoint of endpoints){
    try{
      const response=await fetch(endpoint,{method:"POST",body:"data="+encodeURIComponent(query),headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}});
      if(!response.ok) throw new Error("O serviço de mapas está ocupado. Tente novamente em alguns instantes.");
      return await response.json();
    }catch(e){lastError=e}
  }
  throw lastError||new Error("Falha ao consultar os dados do mapa.");
}
async function runSearch(e){
  e.preventDefault();
  const city=$("city").value.trim(), segment=$("segment").value, radius=Number($("radius").value);
  if(!city)return;
  const btn=$("searchBtn"), status=$("searchStatus");
  btn.disabled=true;btn.innerHTML="<span>◌</span> Pesquisando...";
  status.className="search-status";status.textContent="Localizando a região...";
  $("results").innerHTML=`<div class="empty-state"><div class="empty-icon">◌</div><h3>Pesquisando empresas...</h3><p>Consultando os dados públicos do mapa. Isso pode levar alguns segundos.</p></div>`;
  try{
    const place=await geocode(city);
    status.textContent=`Região localizada: ${place.display_name}. Buscando ${segmentConfig[segment].label.toLowerCase()} em até ${radius/1000} km...`;
    const query=buildQuery(place.lat,place.lon,radius,segmentConfig[segment].selectors);
    const data=await overpass(query);
    const seen=new Set();
    foundBusinesses=(data.elements||[]).filter(el=>isRelevantForSegment(el,segment)).map(toBusiness).filter(Boolean).filter(b=>{
      if(seen.has(b.id))return false;seen.add(b.id);return true;
    }).sort((a,b)=>(Number(isMobile(b.phone))+Number(!b.website))-(Number(isMobile(a.phone))+Number(!a.website)));
    $("resultsTitle").textContent=segmentConfig[segment].label;
    $("resultsSubtitle").textContent=`${foundBusinesses.length} resultado(s) em ${place.name||city} · raio de ${radius/1000} km`;
    status.textContent=foundBusinesses.length?`Busca concluída. ${foundBusinesses.length} empresa(s) localizada(s).`:"Busca concluída, mas nenhum estabelecimento foi encontrado com os dados disponíveis nessa região.";
    rememberRegion(city);rememberSearch(city,segment,radius);
    renderResults();updateStats();
  }catch(err){
    status.className="search-status error";status.textContent=err.message||"Ocorreu um erro durante a busca.";
    $("results").innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h3>Não foi possível concluir a busca</h3><p>${escapeHtml(err.message||"Tente novamente.")}</p></div>`;
  }finally{btn.disabled=false;btn.innerHTML="<span>⌕</span> Buscar empresas"}
}
const leadStatuses = ["Novo","Analisado","Contatado","Respondeu","Interessado","Cliente"];
function renderResults(){
  const savedItems=getSaved();
  const savedIds=new Set(savedItems.map(x=>x.id));
  const source=(activeFilter==="saved"||activeFilter==="followup")?savedItems:foundBusinesses;
  const term=$("filterInput").value.trim().toLowerCase();
  let list=source.filter(b=>{
    const matchesTerm=[b.name,b.address,b.phone,b.segment,b.status||""].join(" ").toLowerCase().includes(term);
    const matchesFilter=activeFilter==="all"||(activeFilter==="phone"&&b.phone)||(activeFilter==="nosite"&&!b.website)||(activeFilter==="saved"&&savedIds.has(b.id))||(activeFilter==="followup"&&isFollowUpDue(b));
    return matchesTerm&&matchesFilter;
  });
  if(!list.length){
    const message=activeFilter==="saved"?"Salve empresas nas buscas para montar sua lista de potenciais clientes.":"Experimente outro filtro ou faça uma nova busca.";
    $("results").innerHTML=`<div class="empty-state"><div class="empty-icon">⌕</div><h3>Nenhuma empresa nesta visualização</h3><p>${message}</p></div>`;return;
  }
  $("results").innerHTML=list.map(b=>{
    const saved=savedIds.has(b.id);
    const phoneLabel=b.phone?`+${b.phone}`:"Telefone não cadastrado";
    const status=leadStatuses.includes(b.status)?b.status:"Novo";
    const mobile=isMobile(b.phone);
    const phoneBadge=!b.phone?["Sem telefone","warn"]:mobile?["Celular disponível","good"]:["Telefone fixo","warn"];
    return `<article class="business-card">
      <div class="card-top"><div><h3 class="business-name">${escapeHtml(b.name)}</h3><div class="business-type">${escapeHtml(b.segment)}</div></div><button class="save-btn ${saved?"saved":""}" data-save="${escapeHtml(b.id)}" title="${saved?"Remover dos salvos":"Salvar empresa"}">${saved?"★":"☆"}</button></div>
      <div class="card-meta">
        <div class="meta-row"><b>⌖</b><span>${escapeHtml(b.address)}</span></div>
        <div class="meta-row"><b>☎</b><span>${escapeHtml(phoneLabel)}</span></div>
        <div class="meta-row"><b>↗</b><span>${b.website?`<a href="${escapeHtml(normalizeWebsite(b.website))}" target="_blank" rel="noopener">Visitar site</a>`:"Nenhum site cadastrado nos dados"}</span></div>
      </div>
      <div class="badges"><span class="badge ${phoneBadge[1]}">${phoneBadge[0]}</span>${isFollowUpDue(b)?'<span class="badge warn">Follow-up pendente</span>':""}<span class="badge ${b.website?"":"good"}">${b.website?"Site cadastrado":"Sem site cadastrado"}</span></div>
      ${saved?`<label class="lead-status-label">Etapa da prospecção<select class="lead-status-select" data-status="${escapeHtml(b.id)}">${leadStatuses.map(x=>`<option value="${x}" ${x===status?"selected":""}>${x}</option>`).join("")}</select></label><label class="lead-status-label">Link da demonstração<input type="url" class="lead-demo-input" data-demo="${escapeHtml(b.id)}" value="${escapeHtml(b.demoUrl||"")}" placeholder="https://..."></label><label class="lead-status-label">Último contato<input type="date" class="lead-demo-input" data-contact="${escapeHtml(b.id)}" value="${escapeHtml(b.lastContact||"")}"></label><label class="lead-status-label">Anotações<textarea class="lead-notes" data-notes="${escapeHtml(b.id)}" rows="2" placeholder="Ex.: falou com o dono, retornar quinta">${escapeHtml(b.notes||"")}</textarea></label>`:""}
      <div class="card-actions">
        ${mobile?`<a class="small-btn whatsapp" href="${waUrl(b.phone,b)}" target="_blank" rel="noopener">◉ Abrir WhatsApp</a>`:b.phone?`<a class="small-btn" href="tel:+${b.phone}">☎ Ligar (fixo)</a>`:`<button class="small-btn" disabled>WhatsApp indisponível</button>`}${saved&&mobile?`<a class="small-btn whatsapp" href="${waUrl(b.phone,b,true)}" target="_blank" rel="noopener">↻ Follow-up</a>`:""}
        <a class="small-btn" href="${mapsUrl(b)}" target="_blank" rel="noopener">Ver no Maps ↗</a>
        <button class="small-btn" data-detail="${escapeHtml(b.id)}">Detalhes</button>
        <button class="small-btn" data-prompt="${escapeHtml(b.id)}">Briefing do site</button><button class="small-btn" data-demo-gen="${escapeHtml(b.id)}">Gerar demo</button>
      </div>
    </article>`;
  }).join("");
}
function updateLeadStatus(id,status){
  if(!leadStatuses.includes(status))return;
  const saved=getSaved();
  const lead=saved.find(x=>x.id===id);
  if(!lead)return;
  lead.status=status;
  if(status==="Contatado"&&!lead.lastContact)lead.lastContact=todayStr();
  lead.updatedAt=new Date().toISOString();
  setSaved(saved);
  toast(`Etapa atualizada: ${status}.`);
  renderResults();
}
function normalizeWebsite(url){return /^https?:\/\//i.test(url)?url:"https://"+url}
function saveBusiness(id){
  const b=foundBusinesses.find(x=>x.id===id);if(!b)return;
  let saved=getSaved();
  if(saved.some(x=>x.id===id)){saved=saved.filter(x=>x.id!==id);toast("Empresa removida dos salvos.")}
  else{saved.unshift({...b,savedAt:new Date().toISOString(),status:"Novo"});toast("Empresa salva no seu painel.")}
  setSaved(saved);renderResults();
}
function showDetails(id){
  const b=foundBusinesses.find(x=>x.id===id)||getSaved().find(x=>x.id===id);if(!b)return;
  $("detailName").textContent=b.name;
  const rows=[["Segmento",b.segment],["Etapa",b.status||"Não salvo"],["Endereço",b.address],["Telefone",b.phoneRaw||"Não cadastrado"],["Site",b.website||"Não cadastrado"],["Fonte",b.source],["Coordenadas",`${b.lat}, ${b.lon}`]];
  $("detailContent").innerHTML=rows.map(([k,v])=>`<div class="detail-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`).join("")+`<div class="detail-actions">${isMobile(b.phone)?`<a class="small-btn whatsapp" href="${waUrl(b.phone,b)}" target="_blank" rel="noopener">Abrir WhatsApp</a>`:""}<a class="small-btn" href="${mapsUrl(b)}" target="_blank" rel="noopener">Abrir no Maps</a></div>`;
  $("detailDialog").showModal();
}
function makeSitePrompt(id){
  const b=foundBusinesses.find(x=>x.id===id)||getSaved().find(x=>x.id===id);if(!b)return;
  const prompt=`Crie um site institucional básico, moderno, responsivo e profissional para uma empresa do segmento ${b.segment}.\n\nNome encontrado: ${b.name}\nEndereço cadastrado: ${b.address}\nTelefone público cadastrado: ${b.phoneRaw||"não disponível"}\nSite atual: ${b.website||"não localizado nos dados consultados"}\n\nRequisitos:\n- Gere HTML, CSS e JavaScript separados, prontos para abrir no VS Code.\n- Design mobile-first, rápido e acessível.\n- Seções: início, serviços, sobre, galeria com espaços reservados e contato.\n- Botão de contato apenas com o telefone confirmado pelo responsável da empresa.\n- Não invente preços, avaliações, depoimentos, serviços específicos, fotos ou horários.\n- Use textos provisórios claramente identificados e placeholders para informações que precisam ser confirmadas.\n- Não publique o site nem use a identidade da empresa como se houvesse autorização. É apenas uma demonstração privada.\n- Explique como personalizar e testar o site.`;
  navigator.clipboard.writeText(prompt).then(()=>toast("Briefing copiado! Cole no ChatGPT ou Claude.")).catch(()=>{window.prompt("Copie o briefing abaixo:",prompt)});
}
// ====== DEMO DO SITE ======
// Depois de criar seu site de demos no Netlify, cole o endereço aqui (sem barra no final).
// Ex.: "https://gstech-demos.netlify.app". Com isso, o link de cada demo entra sozinho na mensagem.
const DEMO_BASE_URL = "";
const demoColors = {serralheria:"#3b4a5c",barbearia:"#8a5a2b",oficina:"#c0392b",restaurante:"#d35400",estetica:"#b0457e",assistencia:"#1f6feb",mercado:"#2e8b57",cafe:"#6f4e37"};
function slugify(t){return String(t||"demo").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"demo"}
function demoFileName(b){return `demo-${slugify(b.name)}-${String(b.id).replace(/\D/g,"").slice(-4)}.html`}
function buildDemoHtml(b){
  const key=(Object.entries(segmentConfig).find(([k,c])=>c.label===b.segment)||[])[0];
  const color=demoColors[key]||"#536dfe";
  const name=escapeHtml(b.name), seg=escapeHtml(b.segment);
  const addr=b.address&&b.address!=="Endereço não cadastrado"?escapeHtml(b.address):"Endereço a confirmar";
  const tel=(style)=>b.phone?`<a class="btn" ${style} href="tel:+${b.phone}">Ligar agora</a>`:"";
  const card=(t)=>`<div class="card"><h3>${t}</h3><p>Descrição a confirmar com o responsável.</p></div>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} · Demonstração</title>
<style>
:root{--c:${color}}*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d2433;line-height:1.6}
.demo{background:#fff3cd;color:#664d03;text-align:center;padding:9px 14px;font-size:13px}
header{background:var(--c);color:#fff;padding:72px 22px;text-align:center}.tag{margin:0 0 8px;opacity:.8;letter-spacing:2px;font-size:12px;text-transform:uppercase}
header h1{margin:0 0 10px;font-size:clamp(28px,6vw,46px)}header p{margin:0 auto 22px;max-width:560px}
.btn{display:inline-block;background:#fff;color:var(--c);padding:12px 22px;border-radius:30px;font-weight:700;text-decoration:none}
section{max-width:960px;margin:0 auto;padding:48px 22px}h2{margin:0 0 18px;color:var(--c)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.card{border:1px solid #e3e7ef;border-radius:12px;padding:18px}.card h3{margin:0 0 6px;font-size:16px}
.ph{background:#eef1f6;border-radius:12px;height:120px;display:grid;place-items:center;color:#8792a7;font-size:13px}
footer{background:#f4f6fa;text-align:center;padding:22px;font-size:12px;color:#758096}
</style></head><body>
<div class="demo">Demonstração de proposta de site para ${name}. Textos e imagens provisórios; não é o site oficial.</div>
<header><p class="tag">${seg}</p><h1>${name}</h1><p>[Texto provisório] Uma frase curta sobre o que a empresa faz de melhor.</p>${tel("")}</header>
<section><h2>Serviços</h2><div class="cards">${card("Serviço 1")}${card("Serviço 2")}${card("Serviço 3")}</div></section>
<section><h2>Sobre</h2><p>[Texto provisório] Aqui entra a história da empresa, seus diferenciais e o jeito de atender.</p></section>
<section><h2>Galeria</h2><div class="cards"><div class="ph">Foto</div><div class="ph">Foto</div><div class="ph">Foto</div></div></section>
<section><h2>Contato</h2><p>${addr}</p>${tel('style="background:var(--c);color:#fff"')}</section>
<footer>${name} · Demonstração criada pela GSTech</footer></body></html>`;
}
function downloadDemo(id){
  const b=foundBusinesses.find(x=>x.id===id)||getSaved().find(x=>x.id===id);if(!b)return;
  const file=demoFileName(b);
  const blob=new Blob([buildDemoHtml(b)],{type:"text/html;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file;a.click();URL.revokeObjectURL(a.href);
  if(DEMO_BASE_URL){
    const saved=getSaved();
    let lead=saved.find(x=>x.id===id);
    if(!lead){lead={...b,savedAt:new Date().toISOString(),status:"Novo"};saved.unshift(lead)}
    lead.demoUrl=DEMO_BASE_URL.replace(/\/+$/,"")+"/"+file;
    setSaved(saved);renderResults();
    toast("Demo baixada e link salvo no lead. Publique a pasta no Netlify.");
  }else{
    toast("Demo baixada! Publique no Netlify e cole o link no lead salvo.");
  }
}
function updateDemoUrl(id,url){
  const saved=getSaved();const lead=saved.find(x=>x.id===id);if(!lead)return;
  const clean=url.trim();
  lead.demoUrl=clean?normalizeWebsite(clean):"";
  setSaved(saved);toast(clean?"Link da demo salvo.":"Link da demo removido.");renderResults();
}
// ====== FIM DEMO ======

// ====== CELULAR, FOLLOW-UP E BACKUP ======
function isMobile(phone){
  if(!phone) return false;
  const n=String(phone).startsWith("55")?String(phone).slice(2):String(phone);
  return n.length===11&&n[2]==="9";
}
function todayStr(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function isFollowUpDue(b){
  const lead=getSaved().find(x=>x.id===b.id)||b;
  if(lead.status!=="Contatado"||!lead.lastContact) return false;
  return (Date.now()-new Date(lead.lastContact+"T00:00:00").getTime())/864e5>=FOLLOWUP_DAYS;
}
function updateLeadField(id,field,value,rerender){
  const saved=getSaved();const lead=saved.find(x=>x.id===id);if(!lead)return;
  lead[field]=value;lead.updatedAt=new Date().toISOString();
  setSaved(saved);toast(field==="notes"?"Anotação salva.":"Data salva.");
  if(rerender)renderResults();
}
function backupData(){
  const data={app:"prospecta-web",version:1,exportedAt:new Date().toISOString(),leads:getSaved(),regions:getRegions()};
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  a.download=`prospecta-backup-${todayStr()}.json`;a.click();URL.revokeObjectURL(a.href);
  toast("Backup baixado. Guarde o arquivo em local seguro.");
}
function restoreData(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d||d.app!=="prospecta-web"||!Array.isArray(d.leads)) throw new Error("formato");
      const map=new Map(getSaved().map(x=>[x.id,x]));
      let added=0,updated=0;
      for(const raw of d.leads){
        if(!raw||typeof raw.id!=="string"||typeof raw.name!=="string") continue;
        const l={...raw,phone:String(raw.phone||"").replace(/\D/g,""),lat:Number(raw.lat)||0,lon:Number(raw.lon)||0};
        const cur=map.get(l.id);
        if(!cur){map.set(l.id,l);added++}
        else if((l.updatedAt||l.savedAt||"")>(cur.updatedAt||cur.savedAt||"")){map.set(l.id,l);updated++}
      }
      setSaved([...map.values()]);
      if(Array.isArray(d.regions)){
        const merged=[...new Set([...getRegions(),...d.regions.filter(x=>typeof x==="string")])].slice(0,MAX_REGIONS);
        try{localStorage.setItem(REGIONS_KEY,JSON.stringify(merged))}catch{}
      }
      renderRegions();renderResults();
      toast(`Backup restaurado: ${added} nova(s), ${updated} atualizada(s).`);
    }catch{toast("Arquivo de backup inválido.")}
  };
  r.readAsText(file);
}
// ====== FIM CELULAR/FOLLOW-UP/BACKUP ======

function exportCsv(){
  const items=activeFilter==="saved"?getSaved():foundBusinesses;
  if(!items.length){toast("Não há empresas para exportar.");return}
  const headers=["Nome","Segmento","Etapa","Endereço","Telefone","Site","Latitude","Longitude","Fonte","Último contato","Anotações","Link da demo"];
  const rows=items.map(b0=>{const b=getSaved().find(x=>x.id===b0.id)||b0;return [b.name,b.segment,b.status||"Não salvo",b.address,b.phoneRaw||"",b.website||"",b.lat,b.lon,b.source,b.lastContact||"",b.notes||"",b.demoUrl||""]});
  const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="prospecta-web-empresas.csv";a.click();URL.revokeObjectURL(a.href);
  toast("CSV exportado.");
}
$("searchForm").addEventListener("submit",runSearch);
$("filterInput").addEventListener("input",renderResults);
$("filterChips").addEventListener("click",e=>{const btn=e.target.closest("[data-filter]");if(!btn)return;activeFilter=btn.dataset.filter;document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===btn));renderResults()});
$("results").addEventListener("click",e=>{
  const save=e.target.closest("[data-save]");if(save)saveBusiness(save.dataset.save);
  const detail=e.target.closest("[data-detail]");if(detail)showDetails(detail.dataset.detail);
  const prompt=e.target.closest("[data-prompt]");if(prompt)makeSitePrompt(prompt.dataset.prompt);
  const gen=e.target.closest("[data-demo-gen]");if(gen)downloadDemo(gen.dataset.demoGen);
});
$("results").addEventListener("change",e=>{
  const status=e.target.closest("[data-status]");
  if(status)updateLeadStatus(status.dataset.status,status.value);
  const demo=e.target.closest("[data-demo]");if(demo)updateDemoUrl(demo.dataset.demo,demo.value);
  const contact=e.target.closest("[data-contact]");if(contact)updateLeadField(contact.dataset.contact,"lastContact",contact.value,true);
  const notes=e.target.closest("[data-notes]");if(notes)updateLeadField(notes.dataset.notes,"notes",notes.value,false);
});
$("closeDialog").addEventListener("click",()=>$("detailDialog").close());
$("exportBtn").addEventListener("click",exportCsv);
$("backupBtn").addEventListener("click",backupData);
$("restoreBtn").addEventListener("click",()=>$("restoreFile").click());
$("restoreFile").addEventListener("change",e=>{const f=e.target.files[0];if(f)restoreData(f);e.target.value=""});
$("regionChips").addEventListener("click",e=>{
  const clear=e.target.closest("[data-clear-regions]");
  if(clear){localStorage.removeItem(REGIONS_KEY);renderRegions();toast("Histórico de regiões limpo.");return}
  const chip=e.target.closest("[data-region]");
  if(chip){$("city").value=chip.dataset.region;$("city").focus()}
});
restoreLastSearch();
renderRegions();
updateStats();
