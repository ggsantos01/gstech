const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "prospecta_web_leads_v1";
let foundBusinesses = [];
let activeFilter = "all";

const segmentConfig = {
  serralheria: { label:"Serralherias", selectors:[['craft','welder'],['craft','metal_construction'],['shop','metal_construction']] },
  barbearia: { label:"Barbearias", selectors:[['shop','hairdresser'],['hairdresser','barber']] },
  oficina: { label:"Oficinas mecânicas", selectors:[['shop','car_repair'],['craft','car_repair'],['amenity','vehicle_inspection']] },
  restaurante: { label:"Restaurantes", selectors:[['amenity','restaurant'],['amenity','fast_food']] },
  estetica: { label:"Clínicas de estética e beleza", selectors:[['shop','beauty'],['beauty','beauty'],['beauty','nails'],['beauty','eyelash'],['beauty','hair_removal'],['beauty','skin_care'],['beauty','tanning'],['shop','hairdresser']] },
  assistencia: { label:"Assistências técnicas", selectors:[['shop','electronics_repair'],['craft','electronics_repair'],['shop','computer']] },
  mercado: { label:"Mercados e mercearias", selectors:[['shop','supermarket'],['shop','convenience']] },
  cafe: { label:"Cafeterias", selectors:[['amenity','cafe']] }
};

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
function waUrl(phone){return phone?`https://wa.me/${phone}`:""}
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
    }).sort((a,b)=>(Number(!!b.phone)+Number(!b.website))-(Number(!!a.phone)+Number(!a.website)));
    $("resultsTitle").textContent=segmentConfig[segment].label;
    $("resultsSubtitle").textContent=`${foundBusinesses.length} resultado(s) em ${place.name||city} · raio de ${radius/1000} km`;
    status.textContent=foundBusinesses.length?`Busca concluída. ${foundBusinesses.length} empresa(s) localizada(s).`:"Busca concluída, mas nenhum estabelecimento foi encontrado com os dados disponíveis nessa região.";
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
  const source=activeFilter==="saved"?savedItems:foundBusinesses;
  const term=$("filterInput").value.trim().toLowerCase();
  let list=source.filter(b=>{
    const matchesTerm=[b.name,b.address,b.phone,b.segment,b.status||""].join(" ").toLowerCase().includes(term);
    const matchesFilter=activeFilter==="all"||(activeFilter==="phone"&&b.phone)||(activeFilter==="nosite"&&!b.website)||(activeFilter==="saved"&&savedIds.has(b.id));
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
    return `<article class="business-card">
      <div class="card-top"><div><h3 class="business-name">${escapeHtml(b.name)}</h3><div class="business-type">${escapeHtml(b.segment)}</div></div><button class="save-btn ${saved?"saved":""}" data-save="${escapeHtml(b.id)}" title="${saved?"Remover dos salvos":"Salvar empresa"}">${saved?"★":"☆"}</button></div>
      <div class="card-meta">
        <div class="meta-row"><b>⌖</b><span>${escapeHtml(b.address)}</span></div>
        <div class="meta-row"><b>☎</b><span>${escapeHtml(phoneLabel)}</span></div>
        <div class="meta-row"><b>↗</b><span>${b.website?`<a href="${escapeHtml(normalizeWebsite(b.website))}" target="_blank" rel="noopener">Visitar site</a>`:"Nenhum site cadastrado nos dados"}</span></div>
      </div>
      <div class="badges"><span class="badge ${b.phone?"good":"warn"}">${b.phone?"Telefone disponível":"Sem telefone"}</span><span class="badge ${b.website?"":"good"}">${b.website?"Site cadastrado":"Sem site cadastrado"}</span></div>
      ${saved?`<label class="lead-status-label">Etapa da prospecção<select class="lead-status-select" data-status="${escapeHtml(b.id)}">${leadStatuses.map(x=>`<option value="${x}" ${x===status?"selected":""}>${x}</option>`).join("")}</select></label>`:""}
      <div class="card-actions">
        ${b.phone?`<a class="small-btn whatsapp" href="${waUrl(b.phone)}" target="_blank" rel="noopener">◉ Abrir WhatsApp</a>`:`<button class="small-btn" disabled>WhatsApp indisponível</button>`}
        <a class="small-btn" href="${mapsUrl(b)}" target="_blank" rel="noopener">Ver no Maps ↗</a>
        <button class="small-btn" data-detail="${escapeHtml(b.id)}">Detalhes</button>
        <button class="small-btn" data-prompt="${escapeHtml(b.id)}">Briefing do site</button>
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
  $("detailContent").innerHTML=rows.map(([k,v])=>`<div class="detail-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`).join("")+`<div class="detail-actions">${b.phone?`<a class="small-btn whatsapp" href="${waUrl(b.phone)}" target="_blank" rel="noopener">Abrir WhatsApp</a>`:""}<a class="small-btn" href="${mapsUrl(b)}" target="_blank" rel="noopener">Abrir no Maps</a></div>`;
  $("detailDialog").showModal();
}
function makeSitePrompt(id){
  const b=foundBusinesses.find(x=>x.id===id)||getSaved().find(x=>x.id===id);if(!b)return;
  const prompt=`Crie um site institucional básico, moderno, responsivo e profissional para uma empresa do segmento ${b.segment}.\n\nNome encontrado: ${b.name}\nEndereço cadastrado: ${b.address}\nTelefone público cadastrado: ${b.phoneRaw||"não disponível"}\nSite atual: ${b.website||"não localizado nos dados consultados"}\n\nRequisitos:\n- Gere HTML, CSS e JavaScript separados, prontos para abrir no VS Code.\n- Design mobile-first, rápido e acessível.\n- Seções: início, serviços, sobre, galeria com espaços reservados e contato.\n- Botão de contato apenas com o telefone confirmado pelo responsável da empresa.\n- Não invente preços, avaliações, depoimentos, serviços específicos, fotos ou horários.\n- Use textos provisórios claramente identificados e placeholders para informações que precisam ser confirmadas.\n- Não publique o site nem use a identidade da empresa como se houvesse autorização. É apenas uma demonstração privada.\n- Explique como personalizar e testar o site.`;
  navigator.clipboard.writeText(prompt).then(()=>toast("Briefing copiado! Cole no ChatGPT ou Claude.")).catch(()=>{window.prompt("Copie o briefing abaixo:",prompt)});
}
function exportCsv(){
  const items=activeFilter==="saved"?getSaved():foundBusinesses;
  if(!items.length){toast("Não há empresas para exportar.");return}
  const headers=["Nome","Segmento","Etapa","Endereço","Telefone","Site","Latitude","Longitude","Fonte"];
  const rows=items.map(b=>[b.name,b.segment,b.status||"Não salvo",b.address,b.phoneRaw||"",b.website||"",b.lat,b.lon,b.source]);
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
});
$("results").addEventListener("change",e=>{
  const status=e.target.closest("[data-status]");
  if(status)updateLeadStatus(status.dataset.status,status.value);
});
$("closeDialog").addEventListener("click",()=>$("detailDialog").close());
$("exportBtn").addEventListener("click",exportCsv);
updateStats();
