const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "prospecta_web_leads_v1";
const REGIONS_KEY = "prospecta_web_regions_v1";
const LAST_SEARCH_KEY = "prospecta_web_last_search_v1";
const MAX_REGIONS = 10;
let foundBusinesses = [];
let activeFilter = "all";
let visibleLimit = 60;

const segmentConfig = {
  restaurante: { label:"Restaurantes", short:"restaurante", color:"#d35400", selectors:[['amenity','restaurant'],['amenity','fast_food']] },
  pizzaria: { label:"Pizzarias", short:"pizzaria", color:"#d35400", selectors:[['cuisine','pizza']] },
  hamburgueria: { label:"Hamburguerias e lanchonetes", short:"hamburgueria", color:"#d35400", selectors:[['cuisine','burger'],['cuisine','sandwich']] },
  churrascaria: { label:"Churrascarias", short:"churrascaria", color:"#d35400", selectors:[['cuisine','steak_house'],['cuisine','barbecue']] },
  japones: { label:"Culinária japonesa", short:"restaurante japonês", color:"#d35400", selectors:[['cuisine','japanese'],['cuisine','sushi']] },
  padaria: { label:"Padarias", short:"padaria", color:"#d35400", selectors:[['shop','bakery']] },
  confeitaria: { label:"Confeitarias e doces", short:"confeitaria", color:"#d35400", selectors:[['shop','pastry'],['shop','confectionery']] },
  cafe: { label:"Cafeterias", short:"cafeteria", color:"#d35400", selectors:[['amenity','cafe']] },
  sorveteria: { label:"Sorveterias e açaí", short:"sorveteria", color:"#d35400", selectors:[['amenity','ice_cream'],['cuisine','ice_cream']] },
  bar: { label:"Bares e botecos", short:"bar", color:"#d35400", selectors:[['amenity','bar'],['amenity','pub']] },
  adega: { label:"Adegas e distribuidoras de bebidas", short:"adega", color:"#d35400", selectors:[['shop','alcohol'],['shop','beverages']] },
  mercado: { label:"Mercados e mercearias", short:"mercado", color:"#d35400", selectors:[['shop','supermarket'],['shop','convenience']] },
  acougue: { label:"Açougues", short:"açougue", color:"#d35400", selectors:[['shop','butcher']] },
  hortifruti: { label:"Hortifrútis e sacolões", short:"hortifrúti", color:"#d35400", selectors:[['shop','greengrocer']] },
  barbearia: { label:"Barbearias", short:"barbearia", color:"#b0457e", selectors:[['shop','hairdresser'],['hairdresser','barber']] },
  salao: { label:"Salões de beleza", short:"salão de beleza", color:"#b0457e", selectors:[['shop','hairdresser'],['shop','beauty']] },
  estetica: { label:"Clínicas de estética e beleza", short:"estética e beleza", color:"#b0457e", selectors:[['shop','beauty'],['beauty','beauty'],['beauty','nails'],['beauty','eyelash'],['beauty','hair_removal'],['beauty','skin_care'],['beauty','tanning'],['shop','hairdresser']] },
  manicure: { label:"Manicures e esmalterias", short:"esmalteria", color:"#b0457e", selectors:[['beauty','nails']] },
  tatuagem: { label:"Estúdios de tatuagem", short:"estúdio de tatuagem", color:"#b0457e", selectors:[['shop','tattoo']] },
  academia: { label:"Academias", short:"academia", color:"#b0457e", selectors:[['leisure','fitness_centre']] },
  massagem: { label:"Massagem e spas", short:"espaço de massagem", color:"#b0457e", selectors:[['shop','massage']] },
  oficina: { label:"Oficinas mecânicas", short:"oficina mecânica", color:"#c0392b", selectors:[['shop','car_repair'],['craft','car_repair'],['amenity','vehicle_inspection']] },
  autopecas: { label:"Autopeças", short:"autopeças", color:"#c0392b", selectors:[['shop','car_parts']] },
  lavajato: { label:"Lava-jatos", short:"lava-jato", color:"#c0392b", selectors:[['amenity','car_wash']] },
  borracharia: { label:"Borracharias", short:"borracharia", color:"#c0392b", selectors:[['shop','tyres']] },
  moto: { label:"Oficinas e lojas de moto", short:"oficina de moto", color:"#c0392b", selectors:[['shop','motorcycle_repair'],['shop','motorcycle']] },
  autoescola: { label:"Autoescolas", short:"autoescola", color:"#c0392b", selectors:[['amenity','driving_school']] },
  serralheria: { label:"Serralherias", short:"serralheria", color:"#3b4a5c", selectors:[['craft','welder'],['craft','metal_construction'],['shop','metal_construction']] },
  marcenaria: { label:"Marcenarias", short:"marcenaria", color:"#3b4a5c", selectors:[['craft','carpenter']] },
  vidracaria: { label:"Vidraçarias", short:"vidraçaria", color:"#3b4a5c", selectors:[['craft','glaziery']] },
  eletricista: { label:"Eletricistas", short:"eletricista", color:"#3b4a5c", selectors:[['craft','electrician']] },
  encanador: { label:"Encanadores", short:"encanador", color:"#3b4a5c", selectors:[['craft','plumber']] },
  pintor: { label:"Pintores", short:"pintor", color:"#3b4a5c", selectors:[['craft','painter']] },
  climatizacao: { label:"Ar-condicionado e refrigeração", short:"empresa de ar-condicionado", color:"#3b4a5c", selectors:[['craft','hvac']] },
  chaveiro: { label:"Chaveiros", short:"chaveiro", color:"#3b4a5c", selectors:[['shop','locksmith'],['craft','locksmith']] },
  tapecaria: { label:"Tapeçarias e estofados", short:"tapeçaria", color:"#3b4a5c", selectors:[['craft','upholsterer']] },
  materiais: { label:"Materiais de construção", short:"loja de materiais de construção", color:"#3b4a5c", selectors:[['shop','doityourself'],['shop','hardware'],['shop','building_materials']] },
  moveis: { label:"Lojas de móveis", short:"loja de móveis", color:"#3b4a5c", selectors:[['shop','furniture']] },
  sexshop: { label:"Sex shops", short:"sex shop", color:"#8a5a2b", selectors:[['shop','erotic']] },
  roupas: { label:"Lojas de roupas", short:"loja de roupas", color:"#8a5a2b", selectors:[['shop','clothes'],['shop','boutique']] },
  calcados: { label:"Lojas de calçados", short:"loja de calçados", color:"#8a5a2b", selectors:[['shop','shoes']] },
  petshop: { label:"Pet shops", short:"pet shop", color:"#8a5a2b", selectors:[['shop','pet'],['shop','pet_grooming']] },
  papelaria: { label:"Papelarias", short:"papelaria", color:"#8a5a2b", selectors:[['shop','stationery']] },
  floricultura: { label:"Floriculturas", short:"floricultura", color:"#8a5a2b", selectors:[['shop','florist']] },
  brinquedos: { label:"Lojas de brinquedos", short:"loja de brinquedos", color:"#8a5a2b", selectors:[['shop','toys']] },
  presentes: { label:"Presentes e variedades", short:"loja de presentes", color:"#8a5a2b", selectors:[['shop','gift'],['shop','variety_store']] },
  joalheria: { label:"Joalherias e relojoarias", short:"joalheria", color:"#8a5a2b", selectors:[['shop','jewelry'],['shop','watches']] },
  optica: { label:"Óticas", short:"ótica", color:"#8a5a2b", selectors:[['shop','optician']] },
  celulares: { label:"Lojas de celulares", short:"loja de celulares", color:"#8a5a2b", selectors:[['shop','mobile_phone']] },
  farmacia: { label:"Farmácias", short:"farmácia", color:"#8a5a2b", selectors:[['amenity','pharmacy'],['shop','chemist']] },
  perfumaria: { label:"Perfumarias e cosméticos", short:"perfumaria", color:"#8a5a2b", selectors:[['shop','perfumery'],['shop','cosmetics']] },
  lavanderia: { label:"Lavanderias", short:"lavanderia", color:"#8a5a2b", selectors:[['shop','laundry'],['shop','dry_cleaning']] },
  grafica: { label:"Gráficas e copiadoras", short:"gráfica", color:"#8a5a2b", selectors:[['shop','copyshop'],['craft','printer']] },
  foto: { label:"Fotógrafos e estúdios", short:"estúdio fotográfico", color:"#8a5a2b", selectors:[['shop','photo'],['craft','photographer']] },
  assistencia: { label:"Assistências técnicas", short:"assistência técnica", color:"#1f6feb", selectors:[['shop','electronics_repair'],['craft','electronics_repair'],['shop','computer']] },
  costura: { label:"Costureiras e ateliês", short:"ateliê de costura", color:"#1f6feb", selectors:[['craft','tailor'],['shop','tailor']] },
  sapateiro: { label:"Sapateiros", short:"sapataria e conserto", color:"#1f6feb", selectors:[['craft','shoemaker'],['shop','shoe_repair']] },
  buffet: { label:"Buffets e festas", short:"buffet", color:"#1f6feb", selectors:[['craft','caterer']] },
  dentista: { label:"Dentistas e odontologia", short:"clínica odontológica", color:"#16845b", selectors:[['amenity','dentist'],['healthcare','dentist']] },
  veterinaria: { label:"Veterinárias", short:"clínica veterinária", color:"#16845b", selectors:[['amenity','veterinary']] },
  fisioterapia: { label:"Fisioterapia", short:"clínica de fisioterapia", color:"#16845b", selectors:[['healthcare','physiotherapist']] },
  psicologia: { label:"Psicólogos e terapeutas", short:"consultório de psicologia", color:"#16845b", selectors:[['healthcare','psychotherapist'],['healthcare','psychologist']] },
  advocacia: { label:"Escritórios de advocacia", short:"escritório de advocacia", color:"#16845b", selectors:[['office','lawyer']] },
  contabilidade: { label:"Contabilidades", short:"escritório de contabilidade", color:"#16845b", selectors:[['office','accountant']] },
  imobiliaria: { label:"Imobiliárias", short:"imobiliária", color:"#16845b", selectors:[['office','estate_agent']] },
  idiomas: { label:"Escolas de idiomas e cursos", short:"escola de idiomas", color:"#16845b", selectors:[['amenity','language_school'],['amenity','music_school'],['amenity','prep_school']] },
  creche: { label:"Escolinhas e creches", short:"escola infantil", color:"#16845b", selectors:[['amenity','kindergarten']] },
  pousada: { label:"Pousadas e hotéis", short:"pousada", color:"#2e8b57", selectors:[['tourism','hotel'],['tourism','guest_house'],['tourism','hostel'],['tourism','motel']] }
};

// ====== REGIÕES SUGERIDAS (edite à vontade) ======
const PRESET_REGIONS = [
  {group:"Zona Leste de São Paulo",items:["Guaianases","Itaquera","São Mateus","Cidade Tiradentes","Penha","Tatuapé","Ermelino Matarazzo","São Miguel Paulista","Itaim Paulista","Vila Matilde","Aricanduva","Sapopemba","Artur Alvim","Cangaíba","Mooca","José Bonifácio"].map(n=>`${n}, São Paulo, SP`)},
  {group:"Grande SP · Leste e Alto Tietê",items:["Ferraz de Vasconcelos","Poá","Suzano","Itaquaquecetuba","Mogi das Cruzes","Arujá","Guarulhos"].map(n=>`${n}, SP`)},
  {group:"Grande SP · ABC e outras",items:["Santo André","São Bernardo do Campo","São Caetano do Sul","Diadema","Mauá","Osasco","Barueri"].map(n=>`${n}, SP`)},
  {group:"Zona Norte de São Paulo",items:["Santana","Tucuruvi","Freguesia do Ó","Vila Maria","Brasilândia"].map(n=>`${n}, São Paulo, SP`)},
  {group:"Zona Sul de São Paulo",items:["Santo Amaro","Capão Redondo","Grajaú","Interlagos","Jabaquara"].map(n=>`${n}, São Paulo, SP`)},
  {group:"Zona Oeste e Centro de São Paulo",items:["Pinheiros","Lapa","Butantã","Centro","Bom Retiro"].map(n=>`${n}, São Paulo, SP`)}
];

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
  const done=new Set(list.map(r=>r.toLowerCase()));
  const all=[...new Set([...list,...PRESET_REGIONS.flatMap(g=>g.items)])];
  $("regionList").innerHTML=all.map(r=>`<option value="${escapeHtml(r)}"></option>`).join("");
  $("regionPreset").innerHTML=`<option value="">Escolher uma região sugerida…</option>`+PRESET_REGIONS.map(g=>`<optgroup label="${escapeHtml(g.group)}">${g.items.map(r=>`<option value="${escapeHtml(r)}">${done.has(r.toLowerCase())?"✓ ":""}${escapeHtml(r.replace(/, (São Paulo, )?SP$/,""))}</option>`).join("")}</optgroup>`).join("");
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

let savedCache=null;
window.addEventListener("storage",()=>{savedCache=null});
function getSaved(){ if(savedCache)return savedCache; try{savedCache=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{savedCache=[]} return savedCache; }
function setSaved(items){ savedCache=items; try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}catch{toast("Armazenamento cheio: faça um backup e apague dados antigos.")} updateStats(); }
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
function toBusiness(el,segKey){
  const tags=el.tags||{}, coords=elementCoords(el);
  if(!coords) return null;
  const phoneRaw=getPhone(tags);
  return {id:`${el.type}/${el.id}`,name:getName(tags),address:getAddress(tags),phone:normalizePhone(phoneRaw),phoneRaw,website:getWebsite(tags),lat:coords.lat,lon:coords.lon,segment:segmentConfig[segKey||$("segment").value].label,source:"OpenStreetMap"};
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
function mapsUrl(b){const q=(b.lat||b.lon)?b.name+" "+b.lat+","+b.lon:b.name+" "+(b.address&&b.address!=="Endereço não cadastrado"?b.address:"");return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
// ====== MENSAGEM DO WHATSAPP ======
// Você pode trocar seu nome e o da sua empresa direto na janela de mensagem (ficam salvos neste navegador).
const SENDER_NAME = "";
const OPTOUT = "Se preferir não receber mensagens, é só avisar.";
const closingChecklist = [["material","Material recebido"],["sinal","Sinal pago"],["dominio","Domínio registrado"],["publicado","Site publicado"]];
const FOLLOWUP_DAYS = 3;   // dias sem resposta para marcar follow-up pendente
const DAILY_LIMIT = 25;    // limite recomendado de contatos por dia
const QUEUE_DELAY_S = 15;  // pausa mínima entre uma abertura do WhatsApp e a próxima, na fila
const MAX_QUEUE = 40;      // máximo de empresas por fila
const SENDER_KEY="prospecta_web_sender_v1",SENDLOG_KEY="prospecta_web_sendlog_v1";
function greeting(){
  const h=new Date().getHours();
  return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
}
function getSender(){
  let s={};try{s=JSON.parse(localStorage.getItem(SENDER_KEY)||"{}")}catch{}
  return {name:s.name??SENDER_NAME,company:s.company||"GSTech",tone:["amigavel","direto","formal"].includes(s.tone)?s.tone:"amigavel"};
}
function saveSender(p){try{localStorage.setItem(SENDER_KEY,JSON.stringify({...getSender(),...p}))}catch{}}
function waMessage(b,mode,o){
  o=o||{};
  const s=getSender(),tone=o.tone||s.tone,v=o.variant||0;
  const cfg=Object.values(segmentConfig).find(c=>c.label===b.segment);
  const hasName=!!b.name&&b.name!=="Estabelecimento sem nome";
  const nome=hasName?`*${String(b.name).replace(/\*/g,"")}*`:"o seu negócio";
  const siteDe=hasName?`o site de ${nome}`:"o site do seu negócio";
  const umSite=hasName?`um site de ${nome}`:"um site do seu negócio";
  const intro=s.name?`Meu nome é ${s.name}, da ${s.company}.`:`Aqui é da ${s.company}.`;
  const demo=(getSaved().find(x=>x.id===b.id)||{}).demoUrl;
  const g=greeting(),hi=v%2?"Como vai?":"Tudo bem?";
  if(mode==="close"){
    const t=tone==="formal"?(v%2?`${g}. Agradeço o interesse e vamos dar andamento.`:`${g}. Fico muito satisfeito com o seu interesse.`):tone==="direto"?(v%2?"Perfeito! Vamos começar.":`${g}! Ótimo, vamos começar.`):`${g}! ${hi} Que bom que você gostou! 🎉`;
    return `${t}\n\nPara começar ${siteDe}, preciso de algumas informações:\n\n• Logo (se tiver)\n• Fotos do local e dos trabalhos\n• Serviços e horários de atendimento\n• O WhatsApp que deve aparecer no site\n• Redes sociais (se quiser incluir)\n\nPosso te enviar uma proposta com escopo, prazo e forma de pagamento para você aprovar?`;
  }
  if(mode==="followup"){
    const ref=demo?`a demonstração que preparei: ${demo}`:`a minha mensagem sobre ${siteDe}`;
    if(tone==="formal")return v%2?`${g}. Gostaria de saber se teve a oportunidade de avaliar ${ref}. Estou à disposição para esclarecer qualquer ponto.\n\n${OPTOUT}`:`${g}. Retomo o contato sobre ${siteDe}. Conseguiu avaliar ${ref}? Fico à disposição para qualquer dúvida.\n\n${OPTOUT}`;
    if(tone==="direto")return v%2?`Oi! Só passando para saber se deu para ver ${ref}. Se não for o momento, sem problema.\n\n${OPTOUT}`:`${g}! Conseguiu ver ${ref}? Se não fizer sentido agora, sem problema: é só me avisar.\n\n${OPTOUT}`;
    return `${g}! ${hi} 😊 Passando só para saber se você conseguiu ver ${ref}.\n\nSe tiver qualquer dúvida, é só chamar. E se não for o momento, pode me dizer que eu não incomodo mais.`;
  }
  const hook=b.website
    ?[`dei uma olhada no site de vocês e tive algumas ideias para deixá-lo ainda mais atrativo.`,`vi o site de vocês e separei algumas ideias de melhoria que podem facilitar a vida de quem procura vocês.`][v%2]
    :[`vocês já têm um site? Não encontrei um por aqui, e hoje muita gente pesquisa no celular antes de escolher onde ir.`,`notei que ainda não encontrei um site de vocês. Eu crio sites simples para negócios da região e achei que poderia ajudar.`][v%2];
  const ask=demo?`Já montei uma demonstração de como poderia ficar: ${demo}\n\nÉ só um exemplo com dados públicos de vocês; se gostar, a gente ajusta tudo com as informações certas. Pode dar uma olhada?`:null;
  if(tone==="formal"&&v%2)return `${g}. ${intro} Trabalhamos com a criação de sites para empresas da região.\n\n${b.website?`Tive a oportunidade de conhecer ${siteDe} e gostaria de compartilhar sugestões de melhoria.`:`Não localizei ${umSite} e gostaria de apresentar uma proposta.`}\n\n${ask||"Teria interesse em receber uma demonstração, sem compromisso?"}\n\nSe preferir, basta me avisar e não entrarei em contato novamente.`;
  if(tone==="formal")return `${g}. ${intro} Atuamos na criação de sites para negócios locais.\n\nGostaria de saber se ${nome} teria interesse em conhecer uma proposta. ${b.website?"Analisei o site atual e tenho sugestões de melhoria.":"Não localizei um site da empresa."}\n\n${ask||"Posso lhe apresentar uma demonstração, sem compromisso?"}\n\nCaso não seja o momento, peço desculpas pelo incômodo e não enviarei novas mensagens.`;
  if(tone==="direto"&&v%2)return `Oi! ${intro} Trabalho com sites para negócios da região. ${b.website?`Dei uma olhada em ${siteDe}`:`Procurei ${siteDe} e não achei`}. ${ask||"Quer ver uma ideia de como poderia ficar?"}\n\n${OPTOUT}`;
  if(tone==="direto")return `${g}! ${intro} Crio sites para negócios locais. ${b.website?`Vi ${siteDe}`:`Não encontrei ${umSite}`}. ${ask||"Posso te mostrar um exemplo rápido?"}\n\n${OPTOUT}`;
  return `${g}! ${hi} 👋 ${intro}\n\nVi ${nome} por aqui na região e queria te fazer uma pergunta rápida: ${hook}\n\n${ask||"Posso te mostrar uma ideia, sem compromisso? 😊"}\n\n${OPTOUT}`;
}
function buildWhatsAppMessage(b,followup,o){return waMessage(b,followup==="close"?"close":followup?"followup":"first",o)}
function waUrl(phone,b,followup){
  if(!phone||(b&&isBlocked(b))) return "";
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
const CACHE_KEY="prospecta_web_cache_v1",CACHE_TTL=3*3600*1000,GEO_KEY="prospecta_web_geo_v1";
function cacheGet(k){try{const e=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}")[k];return e&&Date.now()-e.t<CACHE_TTL?e.list:null}catch{return null}}
function cachePut(k,list){
  try{
    const c=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");c[k]={t:Date.now(),list};
    const n={};Object.keys(c).sort((a,b)=>c[b].t-c[a].t).slice(0,6).forEach(x=>{n[x]=c[x]});
    localStorage.setItem(CACHE_KEY,JSON.stringify(n));
  }catch{}
}
function haversine(a,b,c,d){
  const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;
  return 12742*Math.asin(Math.sqrt(h));
}
function buildQuery(lat,lon,radius,selectors){
  const dLat=radius/111320,dLon=radius/(111320*Math.cos(lat*Math.PI/180));
  const bb=[lat-dLat,lon-dLon,lat+dLat,lon+dLon].map(x=>+x.toFixed(6)).join(",");
  const byKey={};selectors.forEach(([k,v])=>{(byKey[k]=byKey[k]||[]).push(v)});
  const clauses=Object.entries(byKey).map(([k,vs])=>`nw["${k}"${vs.length>1?`~"^(${vs.join("|")})$"`:`="${vs[0]}"`}](${bb});`).join("");
  return `[out:json][timeout:25];(${clauses});out tags center qt;`;
}
async function geocode(place){
  const k=place.trim().toLowerCase();
  try{const g=JSON.parse(localStorage.getItem(GEO_KEY)||"{}");if(g[k])return g[k]}catch{}
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(place)}`;
  const response=await fetch(url,{headers:{"Accept-Language":"pt-BR"}});
  if(!response.ok) throw new Error("Não foi possível localizar a cidade. Tente novamente.");
  const data=await response.json();
  if(!data.length) throw new Error("Local não encontrado. Tente informar cidade e estado.");
  const r={lat:data[0].lat,lon:data[0].lon,display_name:data[0].display_name,name:data[0].name};
  try{const g=JSON.parse(localStorage.getItem(GEO_KEY)||"{}");g[k]=r;const ks=Object.keys(g);if(ks.length>60)delete g[ks[0]];localStorage.setItem(GEO_KEY,JSON.stringify(g))}catch{}
  return r;
}
// Servidores do mapa: tenta o 1º na hora. Se ele falhar, passa ao próximo imediatamente; se só demorar, chama o próximo após 4s.
// O primeiro que responder vence e os outros são cancelados. Se todos falharem, o erro traz o motivo de cada um.
async function overpass(query){
  const endpoints=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://overpass.private.coffee/api/interpreter","https://lz4.overpass-api.de/api/interpreter"];
  const ctrls=endpoints.map(()=>new AbortController());
  const body="data="+encodeURIComponent(query);
  return new Promise((resolve,reject)=>{
    let launched=0,failed=0,done=false;const reasons=[],timers=[];
    const fail=()=>{const e=new Error(`O serviço de mapas está ocupado. Tente novamente em instantes ou reduza o raio. (${reasons.join(" · ")||"sem resposta"})`);e.reasons=reasons;return e};
    const finish=(fn,v)=>{if(done)return;done=true;timers.forEach(clearTimeout);ctrls.forEach(c=>c.abort());fn(v)};
    const launch=()=>{
      if(done||launched>=endpoints.length)return;
      const i=launched++,host=new URL(endpoints[i]).hostname;
      fetch(endpoints[i],{method:"POST",body,headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},signal:ctrls[i].signal})
        .then(async r=>{
          if(!r.ok)throw new Error("HTTP "+r.status);
          const j=await r.json();
          if(j.remark&&/timed out|out of memory|runtime error/i.test(j.remark)&&!(j.elements||[]).length)throw new Error("tempo esgotado");
          finish(resolve,j);
        })
        .catch(err=>{
          if(done)return;
          reasons.push(`${host}: ${err.message}`);
          if(++failed>=endpoints.length)finish(reject,fail());else launch();
        });
      if(launched<endpoints.length)timers.push(setTimeout(launch,4000));
    };
    timers.push(setTimeout(()=>finish(reject,fail()),30000));
    launch();
  });
}
// Plano B gratuito quando todos os servidores acima falham: busca por texto no Nominatim (até 40 resultados, parcial).
async function nominatimFallback(place,segment,radius){
  const lat=Number(place.lat),lon=Number(place.lon);
  const dLat=radius/111320,dLon=radius/(111320*Math.cos(lat*Math.PI/180));
  const vb=[lon-dLon,lat+dLat,lon+dLon,lat-dLat].map(x=>+x.toFixed(6)).join(",");
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(segmentConfig[segment].short)}&viewbox=${vb}&bounded=1&limit=40&extratags=1&addressdetails=1&countrycodes=br`;
  const r=await fetch(url,{headers:{"Accept-Language":"pt-BR"}});
  if(!r.ok)throw new Error("HTTP "+r.status);
  const ok=new Set(["shop","amenity","craft","office","tourism","leisure","healthcare"]);
  return (await r.json()).filter(x=>ok.has(x.category)).map(x=>{
    const a=x.address||{},ex=x.extratags||{};
    return {type:x.osm_type,id:x.osm_id,lat:Number(x.lat),lon:Number(x.lon),tags:{...ex,name:x.name||ex.name||"","addr:street":a.road||"","addr:housenumber":a.house_number||"","addr:suburb":a.suburb||a.neighbourhood||"","addr:city":a.city||a.town||a.village||""}};
  });
}
async function runSearch(e){
  e.preventDefault();
  const city=$("city").value.trim(), segment=$("segment").value, radius=Number($("radius").value);
  if(!city)return;
  const btn=$("searchBtn"), status=$("searchStatus");
  btn.disabled=true;btn.innerHTML="<span>◌</span> Pesquisando...";
  const t0=Date.now();let base="Localizando a região...";
  status.className="search-status";status.textContent=base;
  const tick=setInterval(()=>{status.textContent=`${base} (${Math.round((Date.now()-t0)/1000)}s)`},1000);
  $("results").innerHTML=skeletonHtml();
  try{
    const place=await geocode(city);
    const lat=Number(place.lat),lon=Number(place.lon);
    base=`Região localizada: ${place.display_name}. Buscando ${segmentConfig[segment].label.toLowerCase()} em até ${radius/1000} km...`;
    status.textContent=base;
    const ck=`${lat.toFixed(3)},${lon.toFixed(3)}|${segment}|${radius}`;
    let list=cacheGet(ck),partial=false;const cached=!!list;
    if(!list){
      let els;
      try{els=(await overpass(buildQuery(lat,lon,radius,segmentConfig[segment].selectors))).elements||[]}
      catch(err){
        base="Servidores do mapa ocupados. Tentando a fonte alternativa (resultado parcial)...";status.textContent=base;
        try{els=await nominatimFallback(place,segment,radius);partial=true}catch{throw err}
        if(!els.length)throw err;
      }
      const seen=new Set();list=[];
      for(const el of els){
        if(!isRelevantForSegment(el,segment))continue;
        const b=toBusiness(el);
        if(!b||seen.has(b.id)||haversine(lat,lon,b.lat,b.lon)>radius/1000)continue;
        seen.add(b.id);list.push(b);
      }
      if(list.length&&!partial)cachePut(ck,list);
    }
    foundBusinesses=list.slice().sort((a,b)=>(Number(isMobile(b.phone))+Number(!b.website))-(Number(isMobile(a.phone))+Number(!a.website)));
    visibleLimit=60;
    $("resultsTitle").textContent=segmentConfig[segment].label;
    $("resultsSubtitle").textContent=`${foundBusinesses.length} resultado(s) em ${place.name||city} · raio de ${radius/1000} km`;
    status.textContent=foundBusinesses.length?`Busca concluída em ${((Date.now()-t0)/1000).toFixed(1)}s${cached?" (resultado salvo)":""}${partial?" com fonte alternativa (parcial, até 40 empresas; tente de novo mais tarde para a lista completa)":""}. ${foundBusinesses.length} empresa(s) localizada(s).`:"Busca concluída, mas nenhum estabelecimento foi encontrado com os dados disponíveis nessa região.";
    rememberRegion(city);rememberSearch(city,segment,radius);
    renderResults();updateStats();
  }catch(err){
    status.className="search-status error";status.textContent=err.message||"Ocorreu um erro durante a busca.";
    $("results").innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h3>Não foi possível concluir a busca</h3><p>${escapeHtml(err.message||"Tente novamente.")}</p></div>`;
  }finally{clearInterval(tick);btn.disabled=false;btn.innerHTML="<span>⌕</span> Buscar empresas"}
}
const leadStatuses = ["Novo","Analisado","Contatado","Respondeu","Interessado","Cliente","Não contatar"];
function renderResults(){
  const savedItems=getSaved();
  const savedIds=new Set(savedItems.map(x=>x.id));
  let list=getVisibleList(savedItems,savedIds);
  if(!list.length){
    const message=activeFilter==="saved"?"Salve empresas nas buscas para montar sua lista de potenciais clientes.":"Experimente outro filtro ou faça uma nova busca.";
    $("results").innerHTML=`<div class="empty-state"><div class="empty-icon">⌕</div><h3>Nenhuma empresa nesta visualização</h3><p>${message}</p></div>`;return;
  }
  const total=list.length;list=list.slice(0,visibleLimit);
  $("results").innerHTML=list.map(b=>{
    const saved=savedIds.has(b.id);
    const phoneLabel=b.phone?`+${b.phone}`:"Telefone não cadastrado";
    const status=leadStatuses.includes(b.status)?b.status:"Novo";
    const mobile=isMobile(b.phone);
    const blocked=isBlocked(b);
    const phoneBadge=!b.phone?["Sem telefone","warn"]:mobile?["Celular disponível","good"]:["Telefone fixo","warn"];
    const done=closingChecklist.filter(([k])=>(b.checks||{})[k]).length;
    const checklistHtml=(saved&&(status==="Interessado"||status==="Cliente"))?`<div class="lead-checklist"><b>Checklist de entrega · ${done}/${closingChecklist.length}</b>${closingChecklist.map(([k,l])=>`<label><input type="checkbox" data-check="${escapeHtml(b.id)}|${k}" ${(b.checks||{})[k]?"checked":""}> ${l}</label>`).join("")}</div>`:"";
    return `<article class="business-card">
      <div class="card-top"><div class="card-id"><label class="pick" title="Selecionar para a fila de envio"><input type="checkbox" data-pick="${escapeHtml(b.id)}" aria-label="Selecionar ${escapeHtml(b.name)} para a fila de envio" ${selected.has(b.id)?"checked":""} ${(!mobile||blocked)?"disabled":""}></label><span class="biz-ava" aria-hidden="true">${escapeHtml(((String(b.name).match(/[A-Za-zÀ-ÿ0-9]/)||["•"])[0]).toUpperCase())}</span><div><h3 class="business-name">${escapeHtml(b.name)}</h3><div class="business-type">${escapeHtml(b.segment)}</div></div></div><button class="save-btn ${saved?"saved":""}" data-save="${escapeHtml(b.id)}" title="${saved?"Remover dos salvos":"Salvar empresa"}">${saved?"★":"☆"}</button></div>
      <div class="card-meta">
        <div class="meta-row"><b>⌖</b><span>${escapeHtml(b.address)}</span></div>
        <div class="meta-row"><b>☎</b><span>${escapeHtml(phoneLabel)}</span></div>
        <div class="meta-row"><b>↗</b><span>${b.website?`<a href="${escapeHtml(normalizeWebsite(b.website))}" target="_blank" rel="noopener">Visitar site</a>`:"Nenhum site cadastrado nos dados"}</span></div>
      </div>
      <div class="badges"><span class="badge ${phoneBadge[1]}">${phoneBadge[0]}</span>${isFollowUpDue(b)?'<span class="badge warn">Follow-up pendente</span>':""}${blocked?'<span class="badge warn">Não contatar</span>':""}<span class="badge ${b.website?"":"good"}">${b.website?"Site cadastrado":"Sem site cadastrado"}</span></div>
      ${saved?`<label class="lead-status-label">Etapa da prospecção<select class="lead-status-select" data-status="${escapeHtml(b.id)}">${leadStatuses.map(x=>`<option value="${x}" ${x===status?"selected":""}>${x}</option>`).join("")}</select></label><label class="lead-status-label">Link da demonstração<input type="url" class="lead-demo-input" data-demo="${escapeHtml(b.id)}" value="${escapeHtml(b.demoUrl||"")}" placeholder="https://..."></label><label class="lead-status-label">Último contato<input type="date" class="lead-demo-input" data-contact="${escapeHtml(b.id)}" value="${escapeHtml(b.lastContact||"")}"></label><label class="lead-status-label">Anotações<textarea class="lead-notes" data-notes="${escapeHtml(b.id)}" rows="2" placeholder="Ex.: falou com o dono, retornar quinta">${escapeHtml(b.notes||"")}</textarea></label>`:""}${checklistHtml}
      <div class="card-actions">
        ${blocked?`<button class="small-btn" disabled>Contato bloqueado</button>`:mobile?`<button class="small-btn whatsapp" data-wa="${escapeHtml(b.id)}|first">Escrever no WhatsApp</button>`:b.phone?`<a class="small-btn" href="tel:+${b.phone}">☎ Ligar (fixo)</a>`:`<button class="small-btn" disabled>WhatsApp indisponível</button>`}${saved&&mobile&&!blocked?`<button class="small-btn whatsapp" data-wa="${escapeHtml(b.id)}|followup">↻ Follow-up</button>`:""}${saved&&mobile&&!blocked&&status==="Interessado"?`<button class="small-btn whatsapp" data-wa="${escapeHtml(b.id)}|close">✔ Fechar venda</button>`:""}
        <a class="small-btn" href="${mapsUrl(b)}" target="_blank" rel="noopener">Ver no Maps ↗</a>
        <button class="small-btn" data-detail="${escapeHtml(b.id)}">Detalhes</button>
        <button class="small-btn" data-prompt="${escapeHtml(b.id)}">Briefing do site</button><button class="small-btn" data-demo-gen="${escapeHtml(b.id)}">Gerar demo</button>${saved?`<button class="small-btn" data-site="${escapeHtml(b.id)}">Gerar site final</button>`:""}
      </div>
    </article>`;
  }).join("")+(total>visibleLimit?`<div class="more-row"><button class="secondary-btn" data-more="1">Mostrar mais (${total-visibleLimit} restantes)</button></div>`:"");
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
  toast(status==="Não contatar"?"Marcado como Não contatar: envios bloqueados para este lead.":`Etapa atualizada: ${status}.`);
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
  const rows=[["Segmento",b.segment],["Etapa",b.status||"Não salvo"],["Endereço",b.address],["Telefone",b.phoneRaw||"Não cadastrado"],["Site",b.website||"Não cadastrado"],["Fonte",b.source],["Coordenadas",(b.lat||b.lon)?`${b.lat}, ${b.lon}`:"Não informada"]];
  $("detailContent").innerHTML=rows.map(([k,v])=>`<div class="detail-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`).join("")+`<div class="detail-actions">${isMobile(b.phone)&&!isBlocked(b)?`<button class="small-btn whatsapp" data-wa="${escapeHtml(b.id)}|first">Escrever no WhatsApp</button>`:""}<a class="small-btn" href="${mapsUrl(b)}" target="_blank" rel="noopener">Abrir no Maps</a></div>`;
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
const DEMO_SERIF=["estetica","salao","manicure","confeitaria","floricultura","joalheria","restaurante","pousada","costura","foto"];
const DEMO_DARK=["barbearia","bar","adega","tatuagem","academia","sexshop","moto","oficina"];
const DEMO_EXAMPLES={barbearia:"Corte masculino|Barba|Corte e barba|Sobrancelha",salao:"Corte|Coloração|Escova|Hidratação",estetica:"Limpeza de pele|Design de sobrancelha|Massagem|Depilação",manicure:"Manicure|Pedicure|Alongamento|Esmaltação em gel",restaurante:"Pratos do dia|Executivo|Porções|Sobremesas",pizzaria:"Pizzas tradicionais|Pizzas doces|Bebidas|Entrega",padaria:"Pães|Bolos|Salgados|Café da manhã",oficina:"Revisão|Freios|Suspensão|Troca de óleo",serralheria:"Portões|Grades|Estruturas metálicas|Reparos",mercado:"Hortifrúti|Açougue|Mercearia|Bebidas",petshop:"Banho e tosa|Rações|Acessórios|Veterinário",academia:"Musculação|Aulas coletivas|Avaliação física|Planos",assistencia:"Celulares|Computadores|Troca de tela|Diagnóstico",adega:"Cervejas|Vinhos|Destilados|Entrega"};
function demoPhoto(color,i){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="${i%2?0:1}" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".92"/><stop offset="1" stop-color="#1b2338"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="${i%2?150:650}" cy="130" r="190" fill="#fff" fill-opacity=".08"/><circle cx="${i%2?680:120}" cy="520" r="230" fill="#fff" fill-opacity=".06"/><path d="M0 440C200 380 420 500 800 410V600H0Z" fill="#fff" fill-opacity=".08"/><text x="400" y="310" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#fff" fill-opacity=".94">Sua foto aqui</text></svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
function buildDemoHtml(b){
  const ent=Object.entries(segmentConfig).find(([k,c])=>c.label===b.segment)||[];
  const key=ent[0]||"",cfg=ent[1]||{},short=cfg.short||"negócio";
  const seed=hashStr(b.name+b.id);
  const color=jitterHue(demoColors[key]||cfg.color||"#536dfe",seed);
  const hasAddr=b.address&&b.address!=="Endereço não cadastrado";
  const parts=hasAddr?String(b.address).split(" · "):[];
  const place=parts.length>1?parts[parts.length-1]:"";
  const names=(DEMO_EXAMPLES[key]||"Serviço 1|Serviço 2|Serviço 3|Serviço 4").split("|");
  return buildFinalSite({
    demo:true,seg:key,id:b.id,look:"auto",name:b.name,
    tagline:short.charAt(0).toUpperCase()+short.slice(1)+(place?` em ${place}`:""),
    about:`[Texto de exemplo] Aqui você apresenta ${b.name}: a história, os diferenciais e o jeito de atender. Este conteúdo será substituído por informações reais, aprovadas pelo responsável.\nSeus clientes encontram tudo em um só lugar: serviços, horários, endereço e contato.`,
    services:names.map(n=>`${n} | Exemplo de descrição. Será ajustada com as informações reais.`).join("\n"),
    hours:"Segunda a sexta: horário a confirmar\nSábado: horário a confirmar\nDomingo: horário a confirmar",
    address:hasAddr?String(b.address).replace(/ · /g,", "):"",whatsapp:b.phone||"",instagram:"",facebook:"",
    color,theme:DEMO_DARK.includes(key)?"dark":"light",font:"auto",anim:"on",msg:"",legal:"",cnpj:"",email:"",refund:"",nocnpj:true,distance:false,
    logo:"",cover:"",gallery:[0,1,2].map(i=>demoPhoto(color,i)),alts:"Espaço reservado para foto 1\nEspaço reservado para foto 2\nEspaço reservado para foto 3",
    flags:SEG_FLAGS[key]||{}
  });
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
function updateCheck(ref,checked){
  const [id,key]=ref.split("|");
  const saved=getSaved();const lead=saved.find(x=>x.id===id);if(!lead||!closingChecklist.some(([k])=>k===key))return;
  lead.checks={...(lead.checks||{}),[key]:checked};lead.updatedAt=new Date().toISOString();
  setSaved(saved);renderResults();
  if(closingChecklist.every(([k])=>lead.checks[k])) toast("Tudo concluído! Mude a etapa para Cliente.");
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

// ====== SITE FINAL ======
const SITE_FIELDS=["name","tagline","about","services","hours","address","whatsapp","instagram","facebook","color","theme","font","look","anim","msg","legal","cnpj","email","refund","alts"];
const SITE_BOOLS=["nocnpj","distance"];
const SITE_DEFAULT_MSG="Olá! Vim pelo site e gostaria de mais informações.";
const SEG_FLAGS={sexshop:{adult:1},adega:{alcohol:1},bar:{alcohol:1},advocacia:{reg:"OAB"},dentista:{reg:"CFO/CRO"},psicologia:{reg:"CFP/CRP"},fisioterapia:{reg:"COFFITO/CREFITO"},farmacia:{reg:"CRF e Anvisa"},veterinaria:{reg:"CFMV/CRMV"},contabilidade:{reg:"CFC/CRC"},imobiliaria:{reg:"CRECI"},estetica:{reg:"vigilância sanitária e conselhos profissionais"}};
const RISK_RULES=[
  [/garantid[oa]s?|garantimos|100\s?%|sem risco|resultado[s]?\s+(certo|assegurado)/i,"Promessa de garantia ou resultado: só use se puder comprovar e cumprir."],
  [/\bo\s+melhor\b|\ba\s+melhor\b|n[úu]mero\s*(1|um)\b|l[íi]der|mais barat[oa]|menor pre[çc]o|[úu]nic[oa]\b/i,"Superlativo ou comparação com concorrentes: precisa ser comprovável (risco de publicidade enganosa)."],
  [/depoiment|avalia[çc][õo]|estrela|★|⭐|cliente[s]?\s+satisfeit|nota\s*\d/i,"Menção a avaliações ou depoimentos: use apenas os reais, autorizados e verificáveis."],
  [/\bcura\b|curamos|emagre[çc]|elimina\s|milagr|definitiv[oa]|sem efeitos colaterais/i,"Promessa de saúde ou estética: sujeita a regras de conselhos profissionais e da Anvisa."],
  [/gr[áa]tis|de gra[çc]a|promo[çc][ãa]o|desconto|oferta/i,"Oferta, gratuidade ou desconto: informe condições, prazo e limites com clareza."],
  [/sorteio|concurso|ganhe|pr[êe]mio/i,"Sorteio ou prêmio: promoções desse tipo costumam exigir autorização prévia."]
];
function segNotes(key){
  const f=SEG_FLAGS[key]||{},n=[];
  if(f.adult)n.push("Segmento adulto: use somente fotos sem nudez explícita. O site exibirá aviso de 18+ (isso não substitui verificação de idade).");
  if(f.alcohol)n.push("Bebidas alcoólicas: o site exibirá aviso de venda proibida a menores e \"beba com moderação\". Não direcione publicidade a menores.");
  if(f.reg)n.push(`Segmento regulado (${f.reg}): as regras de publicidade costumam restringir promessas, comparações e divulgação de preços e promoções. Confira antes de publicar.`);
  return n;
}
function scanRisks(d,key){
  const text=[d.tagline,d.about,d.services,d.msg,d.refund].join("\n");
  return [...RISK_RULES.filter(([re])=>re.test(text)).map(r=>r[1]),...segNotes(key)];
}
function validCnpj(v){
  const d=String(v||"").replace(/\D/g,"");
  if(d.length!==14||/^(\d)\1+$/.test(d))return false;
  const calc=n=>{let s=0,p=n-7;for(let i=0;i<n;i++){s+=d[i]*p--;if(p<2)p=9}const r=s%11;return r<2?0:11-r};
  return calc(12)==d[12]&&calc(13)==d[13];
}
const fmtCnpj=v=>String(v).replace(/\D/g,"").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,"$1.$2.$3/$4-$5");
const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));
const rgb2hex=a=>"#"+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
const relLum=h=>{const l=hex2rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*l[0]+.7152*l[1]+.0722*l[2]};
const contrast=(a,b)=>{const x=relLum(a),y=relLum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const mixHex=(h,to,t)=>{const a=hex2rgb(h),b=hex2rgb(to);return rgb2hex(a.map((v,i)=>v+(b[i]-v)*t))};
function accessibleColors(c,bgs,fgText){
  let ct=c,t=0;
  while(bgs.some(b=>contrast(ct,b)<4.5)&&t<1){t+=.05;ct=mixHex(c,fgText,t)}
  const best=h=>contrast(h,"#ffffff")>=contrast(h,"#111111")?"#ffffff":"#111111";
  let btn=c,k=0;
  while(contrast(btn,best(btn))<4.5&&k<1){k+=.05;btn=mixHex(c,"#000000",k)}
  return {ct,btn,on:best(btn)};
}
const SITE_LOOKS=["centro","split","bold","menu","soft"];
const SITE_PROFILE_DEFAULT={svc:"Serviços",cta:"Chamar no WhatsApp",msg:SITE_DEFAULT_MSG,looks:["centro","split","soft"]};
const SITE_PROFILES={};
`restaurante,pizzaria,hamburgueria,churrascaria,japones,sorveteria,cafe|Cardápio|Fazer pedido|Olá! Gostaria de fazer um pedido.|menu,split,bold
padaria,confeitaria|Produtos|Fazer encomenda|Olá! Gostaria de fazer uma encomenda.|soft,menu,split
bar,adega|Produtos|Fazer pedido|Olá! Gostaria de fazer um pedido.|bold,split
mercado,acougue,hortifruti|Produtos|Falar com a loja|Olá! Gostaria de saber mais sobre os produtos.|split,centro,soft
salao,estetica,manicure,massagem|Serviços|Agendar horário|Olá! Gostaria de agendar um horário.|soft,split,centro
barbearia,tatuagem|Serviços|Agendar horário|Olá! Gostaria de agendar um horário.|bold,split
academia|Serviços|Marcar visita|Olá! Gostaria de conhecer a academia.|bold,split,centro
oficina,autopecas,lavajato,borracharia,moto|Serviços|Pedir orçamento|Olá! Gostaria de um orçamento.|bold,centro
serralheria,marcenaria,vidracaria,eletricista,encanador,pintor,climatizacao,chaveiro,tapecaria,costura,sapateiro,assistencia,buffet|Serviços|Pedir orçamento|Olá! Gostaria de um orçamento.|bold,centro,split
materiais,moveis|Produtos|Pedir orçamento|Olá! Gostaria de um orçamento.|split,centro,bold
roupas,calcados,petshop,papelaria,floricultura,brinquedos,presentes,joalheria,optica,celulares,farmacia,perfumaria,lavanderia,grafica,foto,sexshop|Produtos e serviços|Falar com a loja|Olá! Gostaria de mais informações.|split,soft,centro
dentista,veterinaria,fisioterapia,psicologia|Atendimentos|Agendar consulta|Olá! Gostaria de agendar uma consulta.|centro,soft,split
advocacia,contabilidade,imobiliaria|Serviços|Solicitar contato|Olá! Gostaria de mais informações.|centro,split
idiomas,creche,autoescola|Cursos e atividades|Saber mais|Olá! Gostaria de mais informações.|split,soft,centro
pousada|Acomodações|Consultar disponibilidade|Olá! Gostaria de consultar disponibilidade.|soft,split`.split("\n").forEach(l=>{const [ks,svc,cta,msg,looks]=l.split("|");ks.split(",").forEach(k=>{SITE_PROFILES[k]={svc,cta,msg,looks:looks.split(",")}})});
const hashStr=t=>{let h=0;for(const c of String(t))h=(h*31+c.charCodeAt(0))>>>0;return h};
function pickLook(d){
  if(SITE_LOOKS.includes(d.look))return d.look;
  const c=(SITE_PROFILES[d.seg]||SITE_PROFILE_DEFAULT).looks;
  return c[hashStr((d.name||"")+(d.id||""))%c.length];
}
function jitterHue(hex,seed){
  const [r,g,b]=hex2rgb(hex).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,dl=mx-mn;
  let h=0,sat=0;
  if(dl){sat=dl/(1-Math.abs(2*l-1));h=mx===r?((g-b)/dl)%6:mx===g?(b-r)/dl+2:(r-g)/dl+4;h*=60}
  h=(h+((seed%57)-28)+360)%360;
  const c=(1-Math.abs(2*l-1))*sat,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  const [R,G,B]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return rgb2hex([R+m,G+m,B+m].map(v=>v*255));
}
function siteColors(base,dark){
  const bg=dark?"#0e1320":"#ffffff",fg=dark?"#eef1f8":"#18202f",line=dark?"#243049":"#e5e9f1";
  const alt=mixHex(dark?"#151c2e":"#f5f7fb",base,dark?.07:.05),tint=mixHex(bg,base,dark?.16:.11);
  let mut=dark?"#a4aec2":"#5c667a";
  if([alt,tint].some(b=>contrast(mut,b)<4.5))mut=fg;
  return {bg,alt,fg,mut,line,tint,...accessibleColors(base,[bg,alt,tint],fg)};
}
function openSiteForm(id){
  const b=foundBusinesses.find(x=>x.id===id)||getSaved().find(x=>x.id===id);if(!b)return;
  const lead=getSaved().find(x=>x.id===id)||{};
  const ent=Object.entries(segmentConfig).find(([k,c])=>c.label===b.segment)||[];
  const e=ent[1]||{},key=ent[0]||"";
  $("siteForm").reset();$("siteDialog").dataset.id=id;$("siteDialog").dataset.seg=key;
  const d={name:b.name==="Estabelecimento sem nome"?"":b.name,address:b.address==="Endereço não cadastrado"?"":b.address.replace(/ · /g,", "),whatsapp:isMobile(b.phone)?b.phone:"",color:e.color||"#536dfe",theme:"light",font:"auto",look:"auto",anim:"on",msg:(SITE_PROFILES[key]||SITE_PROFILE_DEFAULT).msg,...(lead.site||{})};
  SITE_FIELDS.forEach(f=>{$("sf_"+f).value=d[f]||""});
  SITE_BOOLS.forEach(f=>{$("sf_"+f).checked=!!d[f]});
  const notes=segNotes(key);
  $("sf_segnote").hidden=!notes.length;$("sf_segnote").innerHTML=notes.map(n=>`<div>⚠ ${escapeHtml(n)}</div>`).join("");
  $("siteDialog").showModal();
}
function readImage(file,maxW,q,png){
  return new Promise((res,rej)=>{
    const img=new Image(),u=URL.createObjectURL(file);
    img.onload=()=>{
      const r=Math.min(1,maxW/img.width),c=document.createElement("canvas");
      c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);
      const g=c.getContext("2d");if(!png){g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height)}
      g.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);
      res(c.toDataURL(png?"image/png":"image/jpeg",q));
    };
    img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error("img"))};
    img.src=u;
  });
}
async function generateSite(mode){
  const id=$("siteDialog").dataset.id,key=$("siteDialog").dataset.seg||"";
  const d=Object.fromEntries(SITE_FIELDS.map(f=>[f,$("sf_"+f).value.trim()]));
  SITE_BOOLS.forEach(f=>{d[f]=$("sf_"+f).checked});
  if(!d.name){toast("Informe o nome do negócio.");return}
  if(!d.legal){toast("Informe a razão social ou o nome do responsável.");return}
  if(!d.nocnpj&&!validCnpj(d.cnpj)){toast("CNPJ inválido. Confira os números ou marque \"Não possui CNPJ\".");return}
  if(d.whatsapp&&normalizePhone(d.whatsapp).length<12){toast("WhatsApp incompleto: informe DDD + número.");return}
  if(!d.email&&!d.whatsapp){toast("Informe e-mail ou WhatsApp: é o canal para pedidos de privacidade (LGPD).");return}
  if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)){toast("E-mail inválido.");return}
  if(![1,2,3,4].every(i=>$("sf_ok"+i).checked)){toast("Confirme as 4 declarações antes de gerar.");return}
  const risks=scanRisks(d,key);
  if(risks.length&&!confirm("Atenção, possíveis riscos jurídicos:\n\n• "+risks.join("\n• ")+"\n\nRevise o conteúdo. Gerar mesmo assim?"))return;
  d.flags=SEG_FLAGS[key]||{};d.seg=key;d.id=id;
  const w=mode==="preview"?window.open("","_blank"):null;
  const btns=[$("sitePreview"),$("siteDownload")];btns.forEach(x=>{x.disabled=true});toast("Processando fotos...");
  try{
    const lf=$("sf_logo").files[0],cf=$("sf_cover").files[0],gf=[...$("sf_gallery").files].slice(0,6);
    d.logo=lf?await readImage(lf,500,.9,true):"";
    d.cover=cf?await readImage(cf,1600,.8,false):"";
    d.gallery=[];for(const f of gf)d.gallery.push(await readImage(f,1200,.78,false));
    const html=buildFinalSite(d);
    const saved=getSaved(),lead=saved.find(x=>x.id===id);
    if(lead){lead.site={...Object.fromEntries(SITE_FIELDS.map(f=>[f,d[f]])),nocnpj:d.nocnpj,distance:d.distance};setSaved(saved)}
    const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
    if(w){w.location=url}else{const a=document.createElement("a");a.href=url;a.download="index.html";a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
    const mb=(html.length/1048576).toFixed(1);
    toast(mode==="preview"?`Prévia aberta (${mb} MB).`:`index.html baixado (${mb} MB). Coloque numa pasta e publique.`);
  }catch{if(w)w.close();toast("Não foi possível processar uma das imagens.")}
  finally{btns.forEach(x=>{x.disabled=false})}
}
function legalDocs(d){
  const E=escapeHtml,dt=new Date().toLocaleDateString("pt-BR");
  const ctrl=d.nocnpj?`${E(d.legal)} (pessoa física)`:`${E(d.legal)}, CNPJ ${fmtCnpj(d.cnpj)}`;
  const canal=[d.email&&`e-mail ${E(d.email)}`,d.whatsapp&&`WhatsApp ${E(d.whatsapp)}`].filter(Boolean).join(" ou ");
  const privacy=`<p><b>Última atualização:</b> ${dt}.</p>
<p><b>Quem somos (controlador):</b> ${ctrl}${d.address?`, ${E(d.address)}`:""}. Canal de contato: ${canal}.</p>
<p><b>Quais dados tratamos:</b> este site não possui formulários, não exige cadastro e não coleta dados pessoais diretamente. Se você nos contatar por WhatsApp, e-mail ou telefone, receberemos os dados que você mesmo informar (por exemplo, nome, telefone e o conteúdo da mensagem).</p>
<p><b>Para que usamos:</b> apenas para responder ao seu contato, enviar orçamentos e prestar o atendimento solicitado. Não vendemos seus dados nem os usamos para publicidade de terceiros.</p>
<p><b>Base legal (Lei 13.709/2018 – LGPD):</b> atendimento a pedido do titular, incluindo procedimentos preliminares e execução de contrato (art. 7º, V) e, quando cabível, legítimo interesse (art. 7º, IX).</p>
<p><b>Compartilhamento:</b> o WhatsApp (Meta) e provedores de e-mail e telefonia processam as conversas conforme suas próprias políticas. A hospedagem do site pode registrar dados técnicos de acesso (como endereço IP, data e hora) por segurança e funcionamento. O mapa só é carregado se você clicar em "Carregar mapa"; nesse caso o Google trata os dados conforme a sua política.</p>
<p><b>Por quanto tempo:</b> pelo tempo necessário ao atendimento e ao cumprimento de obrigações legais ou à defesa de direitos.</p>
<p><b>Seus direitos (art. 18):</b> confirmação do tratamento, acesso, correção, anonimização, eliminação, portabilidade, informação sobre compartilhamento e revogação do consentimento, quando aplicável. Para exercer, use o canal de contato acima. Você também pode peticionar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
<p><b>Crianças e adolescentes:</b> o site não é direcionado a menores de 18 anos e não coleta dados de crianças intencionalmente.</p>
<p><b>Alterações:</b> esta política pode ser atualizada; a data acima indica a versão atual.</p>`;
  const terms=`<p><b>Última atualização:</b> ${dt}. Ao usar este site, você concorda com estes termos.</p>
<p><b>Finalidade:</b> site informativo sobre ${E(d.name)}. Serviços, valores, horários e endereço podem mudar sem aviso; confirme diretamente conosco antes de decidir.</p>
<p><b>Sem promessa de resultado:</b> o conteúdo é informativo e não substitui orçamento, contrato ou orientação profissional.</p>
<p><b>Propriedade intelectual:</b> nome, logotipo, textos e imagens pertencem ao titular do site ou são usados com autorização ou licença. A reprodução sem permissão é proibida (Lei 9.610/1998). Se você entende que algum conteúdo viola seus direitos, avise pelo canal de contato para análise e correção.</p>
<p><b>Links externos:</b> WhatsApp, Instagram, Facebook e Google Maps têm termos e políticas próprios.</p>
<p><b>Responsabilidade:</b> buscamos manter o site correto e disponível, sem garantia de funcionamento ininterrupto.</p>
<p><b>Lei aplicável:</b> legislação brasileira. Contato: ${canal}.</p>`;
  const cookies=`<p><b>Última atualização:</b> ${dt}.</p>
<p>Este site <b>não usa cookies próprios nem de terceiros</b> para análise, publicidade ou rastreamento, e não carrega ferramentas de estatística.</p>
<p>O mapa do Google só é carregado se você clicar em "Carregar mapa". Nesse caso, o Google pode definir cookies conforme a política dele. Links para WhatsApp, Instagram e Facebook levam a sites de terceiros, com políticas próprias.</p>
<p>Se passarmos a usar ferramentas que dependam de cookies não essenciais, pediremos o seu consentimento antes.</p>`;
  const refund=d.distance?`<p><b>Última atualização:</b> ${dt}. Vale para compras e contratações feitas à distância (internet, telefone ou WhatsApp).</p>
<p><b>Direito de arrependimento:</b> nas contratações fora do estabelecimento comercial, o consumidor pode desistir em até 7 dias, contados da contratação ou do recebimento do produto ou serviço, com devolução dos valores pagos (Código de Defesa do Consumidor, art. 49).</p>
<p><b>Produtos ou serviços com defeito:</b> seguem os direitos previstos no Código de Defesa do Consumidor.</p>
${d.refund?`<p><b>Regras do estabelecimento:</b> ${E(d.refund)}</p>`:""}
<p><b>Como solicitar:</b> pelo canal de contato: ${canal}.</p>`:"";
  return {privacy,terms,cookies,refund};
}
function buildFinalSite(d){
  const E=escapeHtml,fl=d.flags||{};
  const dark=d.theme==="dark",motion=d.anim!=="off";
  const prof=SITE_PROFILES[d.seg]||SITE_PROFILE_DEFAULT,look=pickLook(d);
  const fsel=d.font==="sans"||d.font==="serif"?d.font:"auto";
  const serif=fsel==="serif"||(fsel==="auto"&&(look==="menu"||look==="soft"));
  const base=/^#[0-9a-f]{6}$/i.test(d.color)?d.color.toLowerCase():"#536dfe";
  const ac=siteColors(base,dark);
  const blob=ac.on==="#ffffff"?"rgba(0,0,0,.2)":"rgba(255,255,255,.25)";
  const phone=normalizePhone(d.whatsapp);
  const wa=phone&&!d.demo?`https://wa.me/${phone}?text=${encodeURIComponent(d.msg||prof.msg)}`:"";
  const ig=d.instagram?`https://instagram.com/${encodeURIComponent(d.instagram.replace(/^.*instagram\.com\//i,"").replace(/^@/,"").replace(/[\/?].*$/,""))}`:"";
  const fb=d.facebook?normalizeWebsite(d.facebook):"";
  const lines=t=>String(t||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const about=lines(d.about),services=lines(d.services).map(l=>l.split("|").map(x=>x.trim())),hours=lines(d.hours),gal=d.gallery||[],alts=lines(d.alts);
  const desc=(d.tagline||about[0]||`Conheça ${d.name}.`).slice(0,155);
  const ld={"@context":"https://schema.org","@type":"LocalBusiness",name:d.name,legalName:d.legal,description:desc,...(d.nocnpj?{}:{taxID:fmtCnpj(d.cnpj)}),...(d.address?{address:d.address}:{}),...(phone?{telephone:"+"+phone}:{}),...(ig||fb?{sameAs:[ig,fb].filter(Boolean)}:{})};
  const waBtn=wa?`<a class="btn" href="${wa}" target="_blank" rel="noopener noreferrer">${E(prof.cta)}</a>`:"";
  const telBtn=phone?`<a class="btn ghost" href="tel:+${phone}">Ligar</a>`:"";
  const maps=d.address?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name+" "+d.address)}`:"";
  const docs=d.demo?{}:legalDocs(d);
  const nav=[about.length&&["sobre","Sobre"],services.length&&["servicos",prof.svc],gal.length&&["galeria","Galeria"],["contato","Contato"]].filter(Boolean);
  const firstId=nav[0][0];
  const waveFill=(about.length||(!services.length&&gal.length))?"var(--bg)":"var(--alt)";
  const hourRow=l=>{const i=l.indexOf(": ");return i>0?`<li><span>${E(l.slice(0,i))}</span><span>${E(l.slice(i+2))}</span></li>`:`<li><span>${E(l)}</span></li>`};
  const heroStyle=d.cover?` style="--cover:url(${d.cover})"`:"";
  const ff='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',fh=serif?'ui-serif,Georgia,"Times New Roman",serif':"var(--ff)";
  const initial=((d.name.match(/[A-Za-zÀ-ÿ0-9]/)||["•"])[0]).toUpperCase();
  const art=d.cover?`<img src="${d.cover}" alt="Foto de ${E(d.name)}">`:`<span class="mono" aria-hidden="true">${E(initial)}</span>`;
  const copy=`<h1>${E(d.name)}</h1>${d.tagline?`<p>${E(d.tagline)}</p>`:""}${fl.adult?`<p><strong>Conteúdo para maiores de 18 anos.</strong></p>`:""}<div class="cta">${waBtn}${telBtn}${d.demo?`<a class="btn ghost" href="#servicos">Ver ${E(prof.svc.toLowerCase())}</a>`:""}</div>`;
  let hero;
  if(look==="split")hero=`<section id="inicio" class="hero"><div class="wrap split"><div class="hcopy">${copy}</div><div class="hart">${art}</div></div></section>`;
  else if(look==="soft")hero=`<section id="inicio" class="hero"><div class="wrap"><div class="arch">${art}</div>${copy}</div></section>`;
  else if(look==="menu")hero=`<section id="inicio" class="hero"><div class="wrap">${d.cover?`<img class="hcover" src="${d.cover}" alt="Foto de ${E(d.name)}">`:""}${copy}</div></section>`;
  else hero=`<section id="inicio" class="hero${d.cover?" img":""}"${heroStyle}><i class="blob b1"></i><i class="blob b2"></i><div class="wrap">${copy}</div>${look==="centro"?`<a class="scroll" href="#${firstId}" aria-label="Rolar para o conteúdo"><span></span></a><svg class="wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 40C240 80 480 0 720 30s720 50 720 10V80H0Z" fill="${waveFill}"/></svg>`:""}</section>`;
  const motionCss=motion?`@media(prefers-reduced-motion:no-preference){
@keyframes up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes fl{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,30px)}}
@keyframes kb{from{transform:scale(1)}to{transform:scale(1.1)}}
@keyframes sc{0%{transform:translateY(0);opacity:1}100%{transform:translateY(14px);opacity:0}}
@keyframes pu{0%{box-shadow:0 0 0 0 rgba(18,140,74,.5)}100%{box-shadow:0 0 0 18px rgba(18,140,74,0)}}
.hero .wrap>*,.hero .hcopy>*{animation:up .9s cubic-bezier(.2,.7,.2,1) both}.hero .wrap>*:nth-child(2),.hero .hcopy>*:nth-child(2){animation-delay:.12s}.hero .wrap>*:nth-child(3),.hero .hcopy>*:nth-child(3){animation-delay:.24s}.hero .wrap>*:nth-child(4),.hero .hcopy>*:nth-child(4){animation-delay:.36s}
.b1{animation:fl 14s ease-in-out infinite}.b2{animation:fl 18s ease-in-out infinite reverse}.hero.img::before{animation:kb 26s ease-in-out infinite alternate}
html.mo .rv{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--i,0)*90ms)}html.mo .rv.in{opacity:1;transform:none}
.btn{transition:transform .2s,box-shadow .2s}.btn:hover{transform:translateY(-2px)}
.card{transition:transform .25s,box-shadow .25s}.L-centro .card:hover,.L-soft .card:hover{transform:translateY(-5px);box-shadow:0 14px 34px rgba(0,0,0,.12)}.card::before{transform:scaleX(.25);transition:transform .35s}.card:hover::before{transform:scaleX(1)}
.gbtn img{transition:transform .6s}.gbtn:hover img{transform:scale(1.07)}.wa{animation:pu 2.4s infinite}.scroll span{animation:sc 1.6s infinite}
}`:"";
  const band=d.demo
    ?`<section class="band"><div class="wrap"><h2 class="rv">Gostou da ideia?</h2><p class="rv">Este é um exemplo de como o site de ${E(d.name)} pode ficar. Fale com quem enviou esta proposta para ajustar tudo com as informações reais.</p></div></section>`
    :(waBtn||telBtn?`<section class="band"><div class="wrap"><h2 class="rv">Vamos conversar?</h2><p class="rv">Fale com ${E(d.name)} e tire suas dúvidas.</p><div class="cta rv">${waBtn}${telBtn}</div></div></section>`:"");
  const legalSection=d.demo?"":`<section id="legal"><div class="wrap"><h2 class="rv">Informações legais</h2>
<details id="privacidade"><summary>Política de Privacidade</summary>${docs.privacy}</details>
<details id="termos"><summary>Termos de Uso</summary>${docs.terms}</details>
<details id="cookies"><summary>Aviso de Cookies</summary>${docs.cookies}</details>
${d.distance?`<details id="reembolso"><summary>Troca e Reembolso</summary>${docs.refund}</details>`:""}
</div></section>`;
  const footerHtml=d.demo?`<footer><div class="wrap"><p>${E(d.name)} · Demonstração criada pela GSTech</p></div></footer>`:`<footer><div class="wrap"><p>${E(d.legal)}${d.nocnpj?"":` · CNPJ ${fmtCnpj(d.cnpj)}`}${d.address?` · ${E(d.address)}`:""}</p>${fl.alcohol?`<p>Venda e oferta de bebidas alcoólicas proibidas para menores de 18 anos. Beba com moderação.</p>`:""}<p><a href="#privacidade">Privacidade</a> · <a href="#termos">Termos de uso</a> · <a href="#cookies">Cookies</a>${d.distance?` · <a href="#reembolso">Troca e reembolso</a>`:""}</p><p>© ${new Date().getFullYear()} ${E(d.name)} · Site por GSTech</p></div></footer>`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>var h=document.documentElement;h.classList.add("js");if(${motion}&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&"IntersectionObserver" in window)h.classList.add("mo")</script>
<title>${E(d.name)}${d.tagline?" · "+E(d.tagline):""}</title><meta name="description" content="${E(desc)}"><meta name="theme-color" content="${ac.btn}">${d.demo?'<meta name="robots" content="noindex,nofollow">':""}
<meta property="og:title" content="${E(d.name)}"><meta property="og:description" content="${E(desc)}"><meta property="og:type" content="website">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,"\\u003c")}</script>
<style>
:root{--c:${base};--btn:${ac.btn};--on:${ac.on};--ct:${ac.ct};--bg:${ac.bg};--alt:${ac.alt};--tint:${ac.tint};--fg:${ac.fg};--mut:${ac.mut};--line:${ac.line};--ff:${ff};--fh:${fh};--r:18px;--rb:999px}
.L-bold{--r:4px;--rb:4px}.L-soft{--r:30px}.L-menu{--r:8px;--rb:8px}.L-split{--r:24px}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:76px}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 var(--ff);-webkit-font-smoothing:antialiased}img{max-width:100%;display:block}a{color:inherit}h1,h2,h3{font-family:var(--fh)}
:focus-visible{outline:3px solid var(--ct);outline-offset:3px}.hero :focus-visible,.band :focus-visible{outline-color:currentColor}main:focus{outline:none}
.skip{position:absolute;left:12px;top:-60px;z-index:100;background:var(--bg);color:var(--fg);padding:10px 16px;border-radius:8px;border:2px solid var(--ct)}.skip:focus{top:12px}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}.bar{position:fixed;left:0;top:0;height:3px;width:100%;background:var(--c);transform:scaleX(0);transform-origin:left;z-index:60}
.demobar{background:#fff3cd;color:#664d03;text-align:center;padding:9px 14px;font-size:13px}
.top{position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:1px solid transparent;transition:border-color .2s,box-shadow .2s}.top.scrolled{border-color:var(--line);box-shadow:0 6px 24px rgba(0,0,0,.08)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:68px;gap:16px}.brand{display:flex;align-items:center;gap:10px;font-weight:800;text-decoration:none}.brand img{height:38px;width:auto;border-radius:8px}
nav{display:flex;gap:4px}nav a{text-decoration:none;color:var(--mut);padding:8px 14px;border-radius:var(--rb);font-size:14px;font-weight:600}nav a:hover{color:var(--ct);background:var(--alt)}
.burger{display:none;width:44px;height:44px;border:1px solid var(--line);border-radius:12px;background:var(--bg);cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:5px}.burger span{display:block;width:20px;height:2px;background:var(--fg);border-radius:2px}
.hero{position:relative;overflow:hidden;isolation:isolate;background:var(--btn);color:var(--on);padding:120px 0 150px;text-align:center}.hero.img{color:#fff}
.hero.img::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,.62)),var(--cover) center/cover}
.blob{position:absolute;z-index:-1;border-radius:50%;filter:blur(40px);background:${blob};pointer-events:none}.b1{width:420px;height:420px;left:-120px;top:-140px}.b2{width:360px;height:360px;right:-100px;bottom:-120px}.hero.img .blob{display:none}
.hero h1{font-size:clamp(36px,7.5vw,68px);line-height:1.05;margin:0 0 16px;letter-spacing:-.02em;font-weight:${serif?700:800}}.hero p{font-size:clamp(16px,2.6vw,20px);max-width:620px;margin:0 auto 28px}
.wave{position:absolute;left:0;bottom:-1px;width:100%;height:64px;display:block}
.scroll{position:absolute;left:50%;bottom:78px;width:26px;height:40px;margin-left:-13px;border:2px solid currentColor;border-radius:14px;opacity:.75}.scroll span{position:absolute;left:50%;top:7px;width:4px;height:8px;margin-left:-2px;border-radius:2px;background:currentColor}
.cta{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}.links{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.btn{display:inline-block;background:var(--btn);color:var(--on);padding:14px 28px;border-radius:var(--rb);font:inherit;font-weight:700;text-decoration:none;border:2px solid var(--btn);cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.16)}
.btn.ghost{background:transparent;color:var(--ct);border-color:var(--ct);box-shadow:none}.hero .btn,.band .btn{background:#fff;color:#111;border-color:#fff}.hero .btn.ghost,.band .btn.ghost{background:transparent;color:inherit;border-color:currentColor}
section{padding:88px 0}section.alt{background:var(--alt)}h2{font-size:clamp(28px,4.4vw,40px);line-height:1.15;margin:0 0 8px;letter-spacing:-.01em}h2::after{content:"";display:block;width:52px;height:4px;border-radius:4px;background:var(--c);margin-top:12px}
.about p{max-width:740px;font-size:17px}.about p:first-of-type{font-size:20px}
ul.cards,ul.gal{list-style:none;padding:0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;margin-top:34px}
.card{position:relative;overflow:hidden;display:flex;flex-direction:column;background:var(--bg);border:1px solid var(--line);border-radius:var(--r);padding:26px 24px 24px}.card::before{content:"";position:absolute;left:0;top:0;width:100%;height:4px;background:var(--c);transform-origin:left}
.num{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--alt);color:var(--ct);font-weight:800;font-size:13px;margin-bottom:14px}.card h3{margin:0 0 6px;font-size:19px}.card p{order:2;margin:0;color:var(--mut);font-size:15px}.dots{display:none}.card .price{order:3;margin-top:12px;color:var(--ct)}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin:34px 0 0;grid-auto-flow:dense}.gbtn{padding:0;border:0;background:none;cursor:zoom-in;border-radius:var(--r);display:block;width:100%;height:100%;overflow:hidden}.gal img{width:100%;height:100%;min-height:190px;aspect-ratio:4/3;object-fit:cover}
@media(min-width:760px){.L-centro .gal li:first-child{grid-column:span 2;grid-row:span 2}.L-centro .gal li:first-child img{aspect-ratio:auto}}
.band{background:var(--btn);color:var(--on);text-align:center;padding:76px 0}.band h2{color:inherit}.band h2::after{margin-left:auto;margin-right:auto;background:currentColor}.band p{max-width:560px;margin:0 auto 26px}
.contact{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;margin-top:30px}.contact ul{list-style:none;padding:0;margin:0}.contact li{padding:9px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:14px}
.mapwrap{border:1px dashed var(--line);border-radius:var(--r);padding:22px;font-size:14px;color:var(--mut)}.map{width:100%;height:300px;border:0;border-radius:var(--r)}
details{border:1px solid var(--line);border-radius:12px;padding:0 16px;margin:10px 0}summary{cursor:pointer;padding:14px 0;font-weight:700}details p{font-size:15px}
footer{padding:28px 0 90px;text-align:center;color:var(--mut);font-size:13px;border-top:1px solid var(--line)}footer p{margin:6px 0}footer a{color:var(--ct);text-decoration:underline}
.wa{position:fixed;right:18px;bottom:18px;z-index:30;width:58px;height:58px;border-radius:50%;background:#128c4a;display:grid;place-items:center;box-shadow:0 8px 22px rgba(0,0,0,.3)}.wa svg{width:30px;height:30px;fill:#fff}
.ck{position:fixed;left:12px;right:90px;bottom:12px;z-index:40;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.2)}.ck p{margin:0}.ck a{color:var(--ct)}.ck button{background:var(--btn);color:var(--on);border:0;border-radius:999px;padding:8px 16px;font:inherit;font-weight:700;cursor:pointer}
dialog{border:1px solid var(--line);border-radius:16px;background:var(--bg);color:var(--fg);max-width:min(92vw,520px);padding:24px}dialog::backdrop{background:rgba(0,0,0,.78)}dialog h2{font-size:24px}
#lb{padding:0;border:0;background:transparent;max-width:96vw;overflow:visible}#lb img{max-height:86vh;max-width:96vw;border-radius:12px}
.lbx,.lbp,.lbn{position:absolute;width:46px;height:46px;border-radius:50%;border:0;background:#fff;color:#111;font-size:24px;cursor:pointer}.lbx{top:8px;right:8px}.lbp{left:8px;top:50%;margin-top:-23px}.lbn{right:8px;top:50%;margin-top:-23px}.lbc{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);background:rgba(0,0,0,.72);color:#fff;border-radius:999px;padding:4px 12px;font-size:13px}
.L-split .hero,.L-menu .hero,.L-soft .hero{color:var(--fg);padding:84px 0 76px}.L-split .hero{background:var(--bg);text-align:left}.L-menu .hero{background:var(--alt)}.L-soft .hero{background:linear-gradient(180deg,var(--tint),var(--bg))}
.L-split .hero .btn,.L-menu .hero .btn,.L-soft .hero .btn{background:var(--btn);color:var(--on);border-color:var(--btn)}.L-split .hero .btn.ghost,.L-menu .hero .btn.ghost,.L-soft .hero .btn.ghost{background:transparent;color:var(--ct);border-color:var(--ct)}
.split{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center}.L-split .hero p{margin-left:0}.L-split .cta{justify-content:flex-start}
.hart{position:relative;isolation:isolate;aspect-ratio:1;max-width:440px;width:100%;margin-left:auto}.hart::before{content:"";position:absolute;inset:18px -18px -18px 18px;border-radius:var(--r);background:var(--tint);border:2px solid var(--c);z-index:-1}
.hart img,.mono{width:100%;height:100%;border-radius:var(--r)}.hart img{object-fit:cover}.mono{display:grid;place-items:center;background:var(--btn);color:var(--on);font:800 clamp(90px,18vw,170px)/1 var(--fh)}
.L-split .cards{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:8px 40px}.L-split .card{display:grid;grid-template-columns:52px 1fr;column-gap:16px;border:0;border-bottom:1px solid var(--line);border-radius:0;padding:20px 0;background:none}.L-split .card::before{display:none}
.L-split .num{grid-row:1/4;margin:0;background:none;border:2px solid var(--c);color:var(--ct);border-radius:50%;width:48px;height:48px}.L-split .card h3,.L-split .card p,.L-split .card .price{grid-column:2}
.L-bold h1,.L-bold h2{text-transform:uppercase;font-weight:900;letter-spacing:-.02em}.L-bold .brand{text-transform:uppercase;letter-spacing:.04em}.L-bold .btn{text-transform:uppercase;letter-spacing:.06em;font-size:14px}.L-bold h2::after{width:72px;height:8px;border-radius:0}
.L-bold .hero{text-align:left;padding:110px 0 160px;clip-path:polygon(0 0,100% 0,100% 90%,0 100%)}.L-bold .hero h1{font-size:clamp(42px,9.5vw,96px);line-height:.98}.L-bold .hero p{margin-left:0}.L-bold .cta{justify-content:flex-start}
.L-bold .cards{grid-template-columns:1fr;gap:0}.L-bold .card{display:grid;grid-template-columns:96px 1fr auto;align-items:baseline;border:0;border-top:3px solid var(--fg);border-radius:0;padding:22px 0;background:none}.L-bold .card:last-child{border-bottom:3px solid var(--fg)}.L-bold .card::before{display:none}
.L-bold .num{display:block;width:auto;height:auto;margin:0;background:none;font:900 44px/1 var(--fh);color:var(--ct);grid-row:1/3}.L-bold .card h3{grid-column:2;font-size:22px;text-transform:uppercase;margin:0}.L-bold .card .price{grid-column:3;grid-row:1;margin:0;font-size:20px}.L-bold .card p{grid-column:2/4;grid-row:2;margin-top:6px}
.L-bold .gal{grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px}.L-bold .gal img{aspect-ratio:1}
.L-menu h2,.L-soft h2,.L-menu .about,.L-soft .about{text-align:center}.L-menu h2::after,.L-soft h2::after{margin-left:auto;margin-right:auto}.L-menu .about p,.L-soft .about p{margin-left:auto;margin-right:auto}
.L-menu .hero .wrap{max-width:none;width:min(860px,calc(100% - 44px));padding:52px 24px;border:2px solid var(--c);border-radius:var(--r);box-shadow:0 0 0 6px var(--alt),0 0 0 7px var(--c)}
.hcover{width:100%;max-height:260px;object-fit:cover;border-radius:var(--r);margin:0 auto 26px}.L-menu .hero h1::after{content:"✦";content:"✦" / "";display:block;color:var(--ct);font-size:22px;margin-top:12px}
.L-menu .cards{grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:6px 56px;margin-top:30px}.L-menu .card{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:0 10px;border:0;border-radius:0;background:none;padding:14px 0}.L-menu .card::before,.L-menu .num{display:none}
.L-menu .card h3{grid-column:1;margin:0;font-size:19px}.L-menu .dots{display:block;grid-column:2;height:0;border-bottom:2px dotted var(--mut);transform:translateY(-4px)}.L-menu .card .price{grid-column:3;margin:0}.L-menu .card p{grid-column:1/-1;margin-top:4px}
.L-menu .gbtn{border:2px solid var(--c);padding:6px;background:var(--bg)}
.arch{width:min(270px,70vw);aspect-ratio:3/4;margin:0 auto 30px;border-radius:999px 999px 28px 28px;overflow:hidden;background:var(--btn);color:var(--on);display:grid;place-items:center}.arch img{width:100%;height:100%;object-fit:cover}.arch .mono{background:none;font-size:110px;border-radius:0}
.L-soft .card{border:0;box-shadow:0 10px 30px rgba(0,0,0,.07);padding:30px 26px}.L-soft .card::before{display:none}.L-soft .num{border-radius:50%;background:var(--tint);width:44px;height:44px}.L-soft .gal li:nth-child(3n+2) img{aspect-ratio:3/4}
@media(max-width:820px){.split{grid-template-columns:1fr}.hart{margin:10px auto 0;max-width:340px}.L-split .hero{text-align:center}.L-split .hero p{margin-left:auto}.L-split .cta{justify-content:center}}
@media(max-width:720px){.js .burger{display:inline-flex}nav{display:none}.js nav.open{display:flex;flex-direction:column;position:absolute;left:0;right:0;top:68px;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px 16px}section{padding:60px 0}.hero{padding:88px 0 120px}.L-split .hero,.L-menu .hero,.L-soft .hero{padding:64px 0 60px}.scroll{display:none}}
@media(max-width:600px){.L-bold .card{grid-template-columns:64px 1fr}.L-bold .card .price{grid-column:2;grid-row:3;margin-top:8px}.L-bold .card p{grid-column:2}.L-bold .num{font-size:34px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
@media print{.rv{opacity:1!important;transform:none!important}.wa,.ck,.bar{display:none}}
${motionCss}
</style></head><body class="L-${look}">
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
${d.demo?`<div class="demobar" role="note">Demonstração de proposta de site para ${E(d.name)}. Textos e imagens de exemplo; não é o site oficial.</div>`:""}
${motion?'<div class="bar" aria-hidden="true"></div>':""}
<header class="top"><div class="wrap"><a class="brand" href="#inicio">${d.logo?`<img src="${d.logo}" alt="Logo de ${E(d.name)}">`:""}<span>${E(d.name)}</span></a><button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu"><span></span><span></span><span></span></button><nav id="menu" aria-label="Principal">${nav.map(([i,t])=>`<a href="#${i}">${E(t)}</a>`).join("")}</nav></div></header>
<main id="conteudo" tabindex="-1">
${hero}
${about.length?`<section id="sobre"><div class="wrap about"><h2 class="rv">Sobre</h2>${about.map((p,i)=>`<p class="rv" style="--i:${i+1}">${E(p)}</p>`).join("")}</div></section>`:""}
${services.length?`<section id="servicos" class="alt"><div class="wrap"><h2 class="rv">${E(prof.svc)}</h2><ul class="cards">${services.map((s,i)=>`<li class="card rv" style="--i:${i%3}"><span class="num" aria-hidden="true">${String(i+1).padStart(2,"0")}</span><h3>${E(s[0])}</h3>${s[2]?'<i class="dots" aria-hidden="true"></i>':""}${s[2]?`<strong class="price">${E(s[2])}</strong>`:""}${s[1]?`<p>${E(s[1])}</p>`:""}</li>`).join("")}</ul></div></section>`:""}
${gal.length?`<section id="galeria"><div class="wrap"><h2 class="rv">Galeria</h2><ul class="gal">${gal.map((g,i)=>{const a=E(alts[i]||`Foto ${i+1} de ${d.name}`);return `<li class="rv" style="--i:${i%3}"><button type="button" class="gbtn" aria-label="Ampliar foto: ${a}"><img src="${g}" alt="${a}" loading="lazy"></button></li>`}).join("")}</ul></div></section>`:""}
${band}
<section id="contato" class="alt"><div class="wrap"><h2 class="rv">Contato</h2><div class="contact"><div class="rv">${d.address?`<p><strong>Endereço</strong><br>${E(d.address)}</p>`:""}${hours.length?`<p><strong>Horários</strong></p><ul>${hours.map(hourRow).join("")}</ul>`:""}<div class="links">${waBtn}${telBtn}${maps?`<a class="btn ghost" href="${maps}" target="_blank" rel="noopener noreferrer">Como chegar</a>`:""}${ig?`<a class="btn ghost" href="${ig}" target="_blank" rel="noopener noreferrer">Instagram</a>`:""}${fb?`<a class="btn ghost" href="${E(fb)}" target="_blank" rel="noopener noreferrer">Facebook</a>`:""}</div></div>${d.address?`<div class="mapwrap rv"><p>O mapa não é carregado automaticamente, para proteger a sua privacidade. Ao carregar, o Google Maps pode usar cookies.</p><button type="button" class="btn ghost" id="mapbtn" data-s="https://maps.google.com/maps?q=${encodeURIComponent(d.address)}&amp;output=embed" data-t="Mapa com a localização de ${E(d.name)}">Carregar mapa</button></div>`:""}</div></div></section>
${legalSection}
</main>
${footerHtml}
${wa?`<a class="wa" href="${wa}" target="_blank" rel="noopener noreferrer" aria-label="Chamar no WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.8-4.6-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.4z"/></svg></a>`:""}
${d.demo?"":`<div class="ck" id="ck" role="region" aria-label="Aviso de cookies"><p>Este site não usa cookies de rastreamento. <a href="#cookies">Saiba mais</a></p><button type="button" id="ckx">Entendi</button></div>`}
<dialog id="lb" aria-label="Foto ampliada"><button type="button" class="lbx" aria-label="Fechar foto">×</button>${gal.length>1?'<button type="button" class="lbp" aria-label="Foto anterior">‹</button><button type="button" class="lbn" aria-label="Próxima foto">›</button>':""}<img src="" alt=""><span class="lbc" aria-live="polite"></span></dialog>
${fl.adult?`<dialog id="age" aria-labelledby="agt"><h2 id="agt">Conteúdo para maiores de 18 anos</h2><p>Este site é destinado a maiores de 18 anos. Você tem 18 anos ou mais?</p><div class="links"><button type="button" class="btn" id="ageyes">Tenho 18 anos ou mais</button><button type="button" class="btn ghost" id="ageno">Sou menor de 18</button></div></dialog>`:""}
<script>(function(){var d=document,h=d.documentElement;
var rv=d.querySelectorAll(".rv");
if(h.classList.contains("mo")){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12,rootMargin:"0px 0px -6% 0px"});rv.forEach(function(e){io.observe(e)})}
var top=d.querySelector(".top"),bar=d.querySelector(".bar");
function sc(){var y=window.scrollY,m=h.scrollHeight-window.innerHeight;top.classList.toggle("scrolled",y>10);if(bar)bar.style.transform="scaleX("+(m>0?y/m:0)+")"}
addEventListener("scroll",sc,{passive:true});sc();
var bg=d.getElementById("burger"),mn=d.getElementById("menu");
if(bg&&mn){var cl=function(){mn.classList.remove("open");bg.setAttribute("aria-expanded","false");bg.setAttribute("aria-label","Abrir menu")};
bg.addEventListener("click",function(){var o=mn.classList.toggle("open");bg.setAttribute("aria-expanded",String(o));bg.setAttribute("aria-label",o?"Fechar menu":"Abrir menu")});
mn.addEventListener("click",function(e){if(e.target.tagName==="A")cl()});
addEventListener("keydown",function(e){if(e.key==="Escape")cl()})}
function op(){var x=location.hash.slice(1),e=x&&d.getElementById(x);if(e&&e.tagName==="DETAILS"){e.open=true;e.scrollIntoView()}}
addEventListener("hashchange",op);op();
var lb=d.getElementById("lb"),bs=[].slice.call(d.querySelectorAll(".gbtn")),ix=0;
function show(i){ix=(i+bs.length)%bs.length;var im=bs[ix].querySelector("img"),t=lb.querySelector("img");t.src=im.src;t.alt=im.alt;lb.querySelector(".lbc").textContent=bs.length>1?(ix+1)+" / "+bs.length:""}
if(lb&&bs.length){bs.forEach(function(b,i){b.addEventListener("click",function(){show(i);lb.showModal()})});
lb.addEventListener("click",function(e){var c=e.target.classList;if(e.target===lb||c.contains("lbx"))lb.close();else if(c.contains("lbp"))show(ix-1);else if(c.contains("lbn"))show(ix+1)});
lb.addEventListener("keydown",function(e){if(e.key==="ArrowLeft")show(ix-1);if(e.key==="ArrowRight")show(ix+1)})}
var mb=d.getElementById("mapbtn");
if(mb)mb.addEventListener("click",function(){var f=d.createElement("iframe");f.className="map";f.title=mb.dataset.t;f.src=mb.dataset.s;mb.parentNode.replaceWith(f);f.focus()});
var ck=d.getElementById("ckx");if(ck)ck.addEventListener("click",function(){d.getElementById("ck").remove()});
var ag=d.getElementById("age");
if(ag){ag.addEventListener("cancel",function(e){e.preventDefault()});d.getElementById("ageyes").addEventListener("click",function(){ag.close()});d.getElementById("ageno").addEventListener("click",function(){location.href="about:blank"});ag.showModal()}
})();</script>
</body></html>`;
}
// ====== FIM SITE FINAL ======

// ====== PRIVACIDADE E DOCUMENTOS ======
function isBlocked(b){const l=getSaved().find(x=>x.id===b.id);return !!l&&l.status==="Não contatar"}
function wipeData(){
  if(!confirm("Apagar TODOS os leads salvos, regiões e dados da GSTech deste navegador? Isso não pode ser desfeito. Faça um backup antes."))return;
  [STORAGE_KEY,REGIONS_KEY,LAST_SEARCH_KEY,"prospecta_web_gstech_v1",CACHE_KEY,GEO_KEY].forEach(k=>{try{localStorage.removeItem(k)}catch{}});savedCache=null;
  foundBusinesses=[];renderRegions();renderResults();updateStats();toast("Dados apagados.");
}
const GS_KEY="prospecta_web_gstech_v1";
const GS_FIELDS=["legal","cnpj","email","city","sinal","rounds","days"];
function openDocForm(){
  let v={sinal:"50",rounds:"2",days:"10"};
  try{v={...v,...JSON.parse(localStorage.getItem(GS_KEY)||"{}")}}catch{}
  GS_FIELDS.forEach(f=>{$("dg_"+f).value=v[f]||""});
  $("docDialog").showModal();
}
function buildDocs(v){
  const E=escapeHtml,dt=new Date().toLocaleDateString("pt-BR");
  const num=(x,max)=>Math.min(max,Math.max(0,parseInt(x,10)||0));
  const sinal=num(v.sinal,100),rounds=num(v.rounds,99),days=num(v.days,365);
  const who=v.cnpj?`${E(v.legal)}, inscrita no CNPJ sob nº ${fmtCnpj(v.cnpj)}`:`${E(v.legal)}, pessoa física, CPF nº ____________________`;
  const pay=sinal>=100?"O pagamento é integral e antecipado, antes do início dos trabalhos.":`${sinal}% do valor é pago como sinal para o início dos trabalhos e o restante, antes da publicação do site.`;
  const css=`body{font:15px/1.65 system-ui,Segoe UI,Roboto,sans-serif;color:#18202f;max-width:820px;margin:0 auto;padding:24px}h1{font-size:24px}h2{font-size:17px;margin:22px 0 4px}.aviso{background:#fff3cd;border:1px solid #e6c870;padding:12px 14px;border-radius:8px;font-size:14px}.doc{page-break-after:always;margin-bottom:48px}.ln{border-bottom:1px solid #444;display:inline-block;min-width:260px}@media print{.aviso{border:1px solid #000;background:none}}`;
  const aviso=`<p class="aviso"><b>MODELO.</b> Gerado automaticamente em ${dt}. Não é parecer jurídico e não garante validade nem proteção contra litígios. Revise com um advogado antes de usar e adapte à sua realidade (CNPJ/MEI, serviços, valores, tributos).</p>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Documentos legais · ${E(v.legal)}</title><style>${css}</style></head><body>
<section class="doc"><h1>Termos de Serviço e Contrato de Prestação de Serviços</h1>${aviso}
<p><b>CONTRATADA:</b> ${who}, e-mail ${E(v.email)}.</p>
<p><b>CONTRATANTE:</b> nome ou razão social <span class="ln"></span> CPF/CNPJ <span class="ln"></span> endereço <span class="ln"></span> e-mail/WhatsApp <span class="ln"></span></p>
<h2>1. Objeto</h2><p>Criação de site institucional e, se contratadas, hospedagem e manutenção, conforme a proposta aprovada, que indica páginas, funcionalidades, valor e prazo.</p>
<h2>2. Prazo</h2><p>Entrega da primeira versão em até ${days} dias úteis, contados do recebimento do sinal e de todo o material necessário. Atrasos do CONTRATANTE no envio de material ou nas aprovações prorrogam o prazo.</p>
<h2>3. Ajustes</h2><p>Estão incluídas ${rounds} rodada(s) de ajustes. Alterações adicionais ou mudança de escopo serão orçadas à parte.</p>
<h2>4. Preço e pagamento</h2><p>Valor conforme proposta. ${pay} Mensalidades, se contratadas, constam na proposta.</p>
<h2>5. Material e responsabilidade do CONTRATANTE</h2><p>O CONTRATANTE fornece textos, logotipos, fotos e dados verdadeiros e declara ter autorização e direitos de uso sobre imagens, marcas e textos enviados. Responde pelas informações, preços, promessas e avaliações publicadas no site. Não serão incluídos depoimentos ou avaliações falsos. A CONTRATADA pode recusar conteúdo ilícito, enganoso ou que viole direitos de terceiros.</p>
<h2>6. Propriedade intelectual</h2><p>Após o pagamento integral, o CONTRATANTE recebe o direito de uso do site desenvolvido para ele. Ferramentas, códigos-base e modelos reutilizáveis permanecem com a CONTRATADA. O conteúdo fornecido pelo CONTRATANTE continua sendo dele.</p>
<h2>7. Domínio e hospedagem</h2><p>O domínio deve ser registrado em nome do CONTRATANTE. A hospedagem segue o que constar na proposta.</p>
<h2>8. Sem promessa de resultado</h2><p>A CONTRATADA não garante posição em buscas, volume de vendas ou de clientes.</p>
<h2>9. Dados pessoais (LGPD)</h2><p>Cada parte trata dados pessoais na medida necessária. A CONTRATADA usa os dados do CONTRATANTE apenas para executar o serviço, conforme sua Política de Privacidade. O CONTRATANTE é responsável pelo tratamento dos dados dos visitantes do próprio site e por manter política de privacidade e canal para titulares.</p>
<h2>10. Cancelamento e reembolso</h2><p>Aplica-se a Política de Reembolso, parte integrante deste contrato.</p>
<h2>11. Foro</h2><p>Fica eleito o foro da comarca de ${E(v.city)}, ressalvadas as regras de competência do Código de Defesa do Consumidor, quando aplicável.</p>
<p>Local e data: <span class="ln"></span></p><p>CONTRATADA: <span class="ln"></span> &nbsp; CONTRATANTE: <span class="ln"></span></p></section>
<section class="doc"><h1>Política de Reembolso</h1>${aviso}
<h2>1. Antes do início do trabalho</h2><p>Devolução integral do sinal.</p>
<h2>2. Após o início, antes da entrega da primeira versão</h2><p>Devolução do valor pago, descontado o trabalho já realizado e custos comprovados, de forma proporcional e com o cálculo informado ao CONTRATANTE.</p>
<h2>3. Após a entrega</h2><p>O serviço entregue conforme a proposta e aprovado não é reembolsável. Defeitos de funcionamento serão corrigidos. Se não puderem ser corrigidos em prazo razoável, o valor correspondente poderá ser devolvido.</p>
<h2>4. Direito de arrependimento</h2><p>Se o CONTRATANTE for consumidor nos termos do Código de Defesa do Consumidor e a contratação ocorrer à distância (internet, telefone ou WhatsApp), ele pode desistir em até 7 dias, contados da contratação, com devolução integral dos valores pagos (art. 49 do CDC). Esta regra prevalece sobre os itens 2 e 3.</p>
<h2>5. Mensalidades</h2><p>Hospedagem e manutenção podem ser canceladas a qualquer momento, por escrito, com efeito a partir do próximo ciclo de cobrança, sem multa. O período já pago e utilizado não é reembolsado. (Ajuste conforme a sua política.)</p>
<h2>6. Como solicitar e prazo</h2><p>Pelo e-mail ${E(v.email)}. A devolução é feita no menor prazo possível, pelo mesmo meio de pagamento usado.</p></section>
<section class="doc"><h1>Política de Privacidade</h1>${aviso}
<p><b>Controlador:</b> ${who}. Contato: ${E(v.email)}.</p>
<h2>Dados que tratamos</h2><p>(a) <b>Clientes:</b> nome, contatos, dados da empresa, textos, imagens e informações fornecidos para criar o site, além dos dados necessários para recibos e pagamento. (b) <b>Prospecção:</b> dados públicos de contato comercial de empresas (nome, endereço, telefone e site), obtidos de bases abertas como o OpenStreetMap, usados para oferecer serviços de criação de sites a empresas.</p>
<h2>Base legal e finalidades</h2><p>Execução de contrato e procedimentos preliminares (LGPD, art. 7º, V) e legítimo interesse na prospecção comercial (art. 7º, IX), com possibilidade de oposição a qualquer momento. Quem pedir para não receber mais mensagens será mantido em uma lista mínima de bloqueio, apenas para não ser contatado novamente.</p>
<h2>Compartilhamento</h2><p>Provedores de hospedagem, domínio e pagamento, na medida necessária. Não vendemos dados pessoais.</p>
<h2>Retenção e segurança</h2><p>Mantemos os dados pelo tempo necessário à finalidade, a obrigações legais e à defesa de direitos, com medidas razoáveis de segurança.</p>
<h2>Seus direitos (art. 18)</h2><p>Confirmação, acesso, correção, anonimização, eliminação, portabilidade, informação sobre compartilhamento e revogação do consentimento, quando aplicável, pelo e-mail ${E(v.email)}. Você também pode peticionar à ANPD.</p>
<p>Última atualização: ${dt}.</p></section></body></html>`;
}
function generateDocs(){
  const v=Object.fromEntries(GS_FIELDS.map(f=>[f,$("dg_"+f).value.trim()]));
  if(!v.legal||!v.email||!v.city){toast("Preencha nome ou razão social, e-mail e cidade/UF.");return}
  if(v.cnpj&&!validCnpj(v.cnpj)){toast("CNPJ inválido. Deixe vazio se for pessoa física.");return}
  try{localStorage.setItem(GS_KEY,JSON.stringify(v))}catch{}
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([buildDocs(v)],{type:"text/html;charset=utf-8"}));
  a.download="documentos-gstech.html";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  toast("Documentos gerados. Revise com um advogado antes de usar.");
}
// ====== FIM PRIVACIDADE E DOCUMENTOS ======

// ====== ASSISTENTE DE MENSAGEM, BUSCA DE LOJA E FILA ======
const selected=new Set();
let wa=null,queue=null,waTimer=null,findCache=[];
function skeletonHtml(){return `<div class="skel-cap">Consultando os dados públicos do mapa… buscas repetidas na mesma região são instantâneas.</div>`+'<div class="skel"></div>'.repeat(6)}
function getVisibleList(savedItems,savedIds){
  const source=(activeFilter==="saved"||activeFilter==="followup")?savedItems:foundBusinesses;
  const term=$("filterInput").value.trim().toLowerCase();
  return source.filter(b=>{
    const matchesTerm=[b.name,b.address,b.phone,b.segment,b.status||""].join(" ").toLowerCase().includes(term);
    const matchesFilter=activeFilter==="all"||(activeFilter==="phone"&&b.phone)||(activeFilter==="nosite"&&!b.website)||(activeFilter==="saved"&&savedIds.has(b.id))||(activeFilter==="followup"&&isFollowUpDue(b));
    return matchesTerm&&matchesFilter;
  });
}
function findLead(id){return foundBusinesses.find(x=>x.id===id)||getSaved().find(x=>x.id===id)}
const fmtWa=t=>escapeHtml(t).replace(/\*([^*\n]+)\*/g,"<strong>$1</strong>");
function fmtPhone(p){const n=String(p||"").replace(/^55/,"");return n.length===11?`+55 (${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:n.length===10?`+55 (${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`:"+"+p}
// ---- contagem de contatos do dia ----
function getSendCount(){try{const l=JSON.parse(localStorage.getItem(SENDLOG_KEY)||"{}");return l.date===todayStr()?(l.count||0):0}catch{return 0}}
function bumpSendLog(){try{localStorage.setItem(SENDLOG_KEY,JSON.stringify({date:todayStr(),count:getSendCount()+1}))}catch{}renderGoal()}
function renderGoal(){const n=getSendCount();$("goalCount").textContent=n;$("goalMax").textContent=DAILY_LIMIT;$("goalBar").style.width=Math.min(100,n/DAILY_LIMIT*100)+"%"}
// ---- registro no CRM (só depois que você confirma que enviou) ----
function registerContact(b,mode){
  const saved=getSaved();let lead=saved.find(x=>x.id===b.id);
  if(!lead){lead={...b,savedAt:new Date().toISOString(),status:"Novo"};saved.unshift(lead)}
  if(mode==="first"||mode==="followup"){
    if(!lead.status||lead.status==="Novo"||lead.status==="Analisado")lead.status="Contatado";
    lead.lastContact=todayStr();bumpSendLog();
  }
  lead.updatedAt=new Date().toISOString();
  setSaved(saved);renderResults();
}
// ---- janela de mensagem ----
function modeFor(id){const l=getSaved().find(x=>x.id===id);return l&&l.status==="Contatado"?"followup":"first"}
function openComposer(id,mode){
  const b=findLead(id);if(!b)return;
  if(isBlocked(b)){toast("Este contato está marcado como Não contatar.");return}
  if(!isMobile(b.phone)){toast("Sem celular cadastrado: use o botão Ligar ou confirme o WhatsApp.");return}
  const s=getSender();
  wa={id,mode:mode||"first",tone:s.tone,variant:0};
  $("waTitle").textContent=b.name;$("waSub").textContent=`${b.segment} · ${fmtPhone(b.phone)}`;
  $("waPName").textContent=b.name;$("waPNum").textContent=fmtPhone(b.phone);
  $("waAvatar").textContent=((String(b.name).match(/[A-Za-zÀ-ÿ0-9]/)||["•"])[0]).toUpperCase();
  $("waEyebrow").textContent={first:"Primeiro contato",followup:"Follow-up",close:"Fechamento"}[wa.mode]||"Mensagem";
  $("waName").value=s.name;$("waCompany").value=s.company;
  $("waStep1").hidden=false;$("waStep2").hidden=true;$("waSkip").hidden=!queue;
  renderQueueBanner();refreshWaText();
  if(!$("waDialog").open)$("waDialog").showModal();
  startWaTimer();
}
function refreshWaText(){
  const b=findLead(wa.id);
  $("waText").value=waMessage(b,wa.mode,{tone:wa.tone,variant:wa.variant});
  document.querySelectorAll(".tone[data-tone]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.tone===wa.tone)));
  updateWaPreview();
}
function updateWaPreview(){
  const t=$("waText").value,d=new Date();
  $("waBubble").innerHTML=fmtWa(t)||"<em>Escreva a mensagem…</em>";
  $("waTime").textContent=`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  $("waCount").textContent=`${t.length} caracteres`;
}
function renderQueueBanner(){
  const el=$("waQueue");
  if(!queue){el.hidden=true;return}
  const done=queue.total-queue.ids.length;
  el.hidden=false;
  $("waQueueText").textContent=`Fila: ${Math.min(done+1,queue.total)} de ${queue.total} · hoje ${getSendCount()} de ${DAILY_LIMIT}`;
  $("waQueueBar").style.width=(done/queue.total*100)+"%";
}
function startWaTimer(){
  clearInterval(waTimer);waTimer=null;
  const btn=$("waOpen");btn.textContent="Abrir WhatsApp";btn.disabled=false;
  if(!queue||!queue.lastOpenAt)return;
  const tick=()=>{
    const left=Math.ceil((queue.lastOpenAt+QUEUE_DELAY_S*1000-Date.now())/1000);
    if(left>0){btn.disabled=true;btn.textContent=`Aguarde ${left}s…`}
    else{btn.disabled=false;btn.textContent="Abrir WhatsApp";clearInterval(waTimer);waTimer=null}
  };
  tick();if(btn.disabled)waTimer=setInterval(tick,300);
}
function waOpenChat(){
  const b=findLead(wa.id),text=$("waText").value.trim();
  if(!b||!text)return;
  if(isBlocked(b)){toast("Contato bloqueado.");return}
  if(wa.mode!=="close"&&getSendCount()>=DAILY_LIMIT&&!confirm(`Você já registrou ${getSendCount()} contatos hoje (limite recomendado: ${DAILY_LIMIT}). Continuar mesmo assim?`))return;
  window.open(`https://wa.me/${b.phone}?text=${encodeURIComponent(text)}`,"_blank","noopener");
  if(queue)queue.lastOpenAt=Date.now();
  $("waStep1").hidden=true;$("waStep2").hidden=false;
}
function queueNext(){
  if(!queue)return;
  queue.ids.shift();
  if(!queue.ids.length){const n=queue.total;queue=null;$("waDialog").close();toast(`Fila concluída: ${n} empresa(s) percorridas.`);return}
  openComposer(queue.ids[0],modeFor(queue.ids[0]));
}
function waSentDone(){
  const b=findLead(wa.id);if(!b)return;
  registerContact(b,wa.mode);selected.delete(b.id);updateSelBar();
  toast("Contato registrado no seu CRM.");
  if(queue)queueNext();else $("waDialog").close();
}
function waSkip(){if(!queue)return;selected.delete(wa.id);updateSelBar();queueNext()}
// ---- seleção e fila ----
function updateSelBar(){$("selBar").hidden=selected.size===0;$("selCount").textContent=selected.size}
function togglePick(id,on){
  if(on){if(selected.size>=MAX_QUEUE){toast(`Máximo de ${MAX_QUEUE} empresas por fila.`);renderResults();return}selected.add(id)}else selected.delete(id);
  updateSelBar();
}
function selectVisible(){
  const savedItems=getSaved(),ids=new Set(savedItems.map(x=>x.id));
  const okStatus=b=>{const l=savedItems.find(x=>x.id===b.id),st=l?l.status:"Novo";return activeFilter==="followup"?st==="Contatado":(!st||st==="Novo"||st==="Analisado")};
  let n=0;
  for(const b of getVisibleList(savedItems,ids)){
    if(selected.size>=MAX_QUEUE)break;
    if(isMobile(b.phone)&&!isBlocked(b)&&okStatus(b)&&!selected.has(b.id)){selected.add(b.id);n++}
  }
  updateSelBar();renderResults();
  toast(n?`${n} empresa(s) selecionada(s) para a fila.`:"Nenhuma empresa elegível: precisa de celular e ainda não ter sido contatada.");
}
function startQueue(){
  const ids=[...selected].filter(id=>{const b=findLead(id);return b&&isMobile(b.phone)&&!isBlocked(b)}).slice(0,MAX_QUEUE);
  if(!ids.length){toast("Selecione empresas com celular para montar a fila.");return}
  if(getSendCount()>=DAILY_LIMIT&&!confirm(`Você já registrou ${getSendCount()} contatos hoje (limite recomendado: ${DAILY_LIMIT}). Iniciar a fila mesmo assim?`))return;
  queue={ids,total:ids.length,lastOpenAt:0};
  openComposer(ids[0],modeFor(ids[0]));
}
// ---- procurar uma loja específica ----
const NOM_SKIP=new Set(["boundary","place","highway","waterway","natural","landuse","railway"]);
function nomElement(x){
  const a=x.address||{},ex=x.extratags||{};
  return {type:x.osm_type,id:x.osm_id,lat:Number(x.lat),lon:Number(x.lon),tags:{...ex,name:x.name||ex.name||"","addr:street":a.road||"","addr:housenumber":a.house_number||"","addr:suburb":a.suburb||a.neighbourhood||"","addr:city":a.city||a.town||a.village||""}};
}
async function nominatimSearch(q){
  const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&extratags=1&countrycodes=br&q=${encodeURIComponent(q)}`,{headers:{"Accept-Language":"pt-BR"}});
  if(!r.ok)throw new Error("HTTP "+r.status);
  return (await r.json()).filter(x=>!NOM_SKIP.has(x.category));
}
async function findPlace(e){
  e.preventDefault();
  const name=$("findName").value.trim(),street=$("findStreet").value.trim(),city=($("findCity").value||$("city").value).trim(),seg=$("findSegment").value;
  if(!name)return;
  const out=$("findResults"),btn=$("findBtn");
  btn.disabled=true;out.innerHTML=`<p class="find-note">Procurando…</p>`;
  const queries=[...new Set([[name,street,city],[name,city]].map(a=>a.filter(Boolean).join(", ")))];
  let rows=[],failed=false;
  try{for(let i=0;i<queries.length&&!rows.length;i++){if(i)await new Promise(r=>setTimeout(r,1100));rows=await nominatimSearch(queries[i])}}catch{failed=true}
  btn.disabled=false;
  findCache=rows.map(x=>toBusiness(nomElement(x),seg)).filter(b=>b&&b.name!=="Estabelecimento sem nome");
  const gm=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name,street,city].filter(Boolean).join(" "))}`;
  if(!findCache.length){
    out.innerHTML=`<p class="find-note">${failed?"Não consegui consultar o mapa agora. Tente de novo em instantes.":"Não encontrei essa loja nos dados abertos do mapa."} Você pode conferir no <a href="${gm}" target="_blank" rel="noopener">Google Maps ↗</a> e cadastrar manualmente com o telefone que encontrar.</p>`;
    return;
  }
  out.innerHTML=findCache.map((b,i)=>`<div class="find-item"><div><b>${escapeHtml(b.name)}</b><small>${escapeHtml(b.address)}${b.phone?` · +${escapeHtml(b.phone)}`:" · sem telefone no mapa"}</small></div><button class="small-btn" data-find-add="${i}" type="button">Adicionar e salvar</button></div>`).join("")+`<p class="find-note">Resultados do OpenStreetMap, que pode estar desatualizado. Confira o endereço antes de abordar.</p>`;
}
function addFound(b){
  if(!foundBusinesses.some(x=>x.id===b.id))foundBusinesses.unshift(b);
  const saved=getSaved();
  if(!saved.some(x=>x.id===b.id)){saved.unshift({...b,savedAt:new Date().toISOString(),status:"Novo"});setSaved(saved)}
  activeFilter="all";visibleLimit=60;$("filterInput").value="";
  document.querySelectorAll("#filterChips .chip").forEach(x=>x.classList.toggle("active",x.dataset.filter==="all"));
  renderResults();updateStats();toast(`${b.name} adicionada e salva.`);
  $("leads").scrollIntoView({behavior:"smooth"});
}
function openManual(pre){
  $("manualForm").reset();$("mSegment").value=$("segment").value;
  if(pre){$("mName").value=pre.name||"";$("mAddress").value=pre.address||"";$("mSegment").value=pre.seg||$("segment").value}
  $("manualDialog").showModal();
}
function saveManual(){
  const name=$("mName").value.trim();if(!name){toast("Informe o nome da empresa.");return}
  const raw=$("mPhone").value.trim(),phone=normalizePhone(raw);
  if(raw&&phone.length<12){toast("Telefone incompleto: informe DDD + número.");return}
  const addr=$("mAddress").value.trim(),seg=$("mSegment").value;
  addFound({id:`manual/${Date.now().toString(36)}`,name,address:addr||"Endereço não cadastrado",phone,phoneRaw:raw,website:$("mSite").value.trim(),lat:0,lon:0,segment:segmentConfig[seg].label,source:"Cadastro manual"});
  $("manualDialog").close();
}
// ====== FIM ASSISTENTE ======

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
$("filterInput").addEventListener("input",()=>{visibleLimit=60;renderResults()});
$("filterChips").addEventListener("click",e=>{const btn=e.target.closest("[data-filter]");if(!btn)return;activeFilter=btn.dataset.filter;visibleLimit=60;document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===btn));renderResults()});
$("results").addEventListener("click",e=>{
  if(e.target.closest("[data-more]")){visibleLimit+=60;renderResults();return}
  const wab=e.target.closest("[data-wa]");if(wab){const [wid,wm]=wab.dataset.wa.split("|");openComposer(wid,wm);return}
  const save=e.target.closest("[data-save]");if(save)saveBusiness(save.dataset.save);
  const detail=e.target.closest("[data-detail]");if(detail)showDetails(detail.dataset.detail);
  const prompt=e.target.closest("[data-prompt]");if(prompt)makeSitePrompt(prompt.dataset.prompt);
  const gen=e.target.closest("[data-demo-gen]");if(gen)downloadDemo(gen.dataset.demoGen);
  const site=e.target.closest("[data-site]");if(site)openSiteForm(site.dataset.site);
});
$("results").addEventListener("change",e=>{
  const pk=e.target.closest("[data-pick]");if(pk){togglePick(pk.dataset.pick,pk.checked);return}
  const status=e.target.closest("[data-status]");
  if(status)updateLeadStatus(status.dataset.status,status.value);
  const demo=e.target.closest("[data-demo]");if(demo)updateDemoUrl(demo.dataset.demo,demo.value);
  const contact=e.target.closest("[data-contact]");if(contact)updateLeadField(contact.dataset.contact,"lastContact",contact.value,true);
  const chk=e.target.closest("[data-check]");if(chk)updateCheck(chk.dataset.check,chk.checked);
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
const THEME_KEY="prospecta_web_theme_v1";
function applyTheme(t){
  document.documentElement.dataset.theme=t;
  const b=$("themeBtn");b.textContent=t==="dark"?"☀":"☾";b.title=t==="dark"?"Mudar para modo claro":"Mudar para modo escuro";
}
applyTheme(document.documentElement.dataset.theme==="dark"?"dark":"light");
$("themeBtn").addEventListener("click",()=>{
  const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
  applyTheme(next);try{localStorage.setItem(THEME_KEY,next)}catch{}
});
$("wipeBtn").addEventListener("click",wipeData);
$("docOpen").addEventListener("click",openDocForm);
$("docClose").addEventListener("click",()=>$("docDialog").close());
$("docGen").addEventListener("click",generateDocs);
$("siteClose").addEventListener("click",()=>$("siteDialog").close());
$("sitePreview").addEventListener("click",()=>generateSite("preview"));
$("siteDownload").addEventListener("click",()=>generateSite("download"));
$("regionPreset").addEventListener("change",e=>{if(e.target.value){$("city").value=e.target.value;$("city").focus();e.target.value=""}});
["findSegment","mSegment"].forEach(id=>{$(id).innerHTML=$("segment").innerHTML});
restoreLastSearch();
renderRegions();
$("findSegment").value=$("segment").value;
$("segment").addEventListener("change",()=>{$("findSegment").value=$("segment").value});
$("findForm").addEventListener("submit",findPlace);
$("findResults").addEventListener("click",e=>{const a=e.target.closest("[data-find-add]");if(a&&findCache[a.dataset.findAdd])addFound(findCache[a.dataset.findAdd])});
$("manualOpen").addEventListener("click",()=>openManual({name:$("findName").value.trim(),address:[$("findStreet").value.trim(),$("findCity").value.trim()].filter(Boolean).join(", "),seg:$("findSegment").value}));
$("manualClose").addEventListener("click",()=>$("manualDialog").close());
$("manualSave").addEventListener("click",saveManual);
$("detailContent").addEventListener("click",e=>{const w=e.target.closest("[data-wa]");if(w){const [wid,wm]=w.dataset.wa.split("|");$("detailDialog").close();openComposer(wid,wm)}});
$("waDialog").addEventListener("click",e=>{
  const t=e.target.closest(".tone[data-tone]");
  if(t&&wa){wa.tone=t.dataset.tone;wa.variant=0;saveSender({tone:wa.tone});refreshWaText();return}
  if(e.target.closest("#waShuffle")&&wa){wa.variant++;refreshWaText()}
});
$("waDialog").addEventListener("close",()=>{clearInterval(waTimer);waTimer=null;if(queue){queue=null;toast("Fila pausada. Clique em Iniciar fila para continuar de onde parou.")}});
$("waText").addEventListener("input",updateWaPreview);
$("waName").addEventListener("change",()=>{saveSender({name:$("waName").value.trim()});if(wa)refreshWaText()});
$("waCompany").addEventListener("change",()=>{saveSender({company:$("waCompany").value.trim()||"GSTech"});if(wa)refreshWaText()});
$("waClose").addEventListener("click",()=>$("waDialog").close());
$("waOpen").addEventListener("click",waOpenChat);
$("waCopy").addEventListener("click",()=>{navigator.clipboard.writeText($("waText").value).then(()=>toast("Mensagem copiada.")).catch(()=>toast("Não foi possível copiar."))});
$("waSent").addEventListener("click",waSentDone);
$("waNot").addEventListener("click",()=>{$("waStep1").hidden=false;$("waStep2").hidden=true;startWaTimer()});
$("waSkip").addEventListener("click",waSkip);
$("selAllBtn").addEventListener("click",selectVisible);
$("selClear").addEventListener("click",()=>{selected.clear();updateSelBar();renderResults()});
$("selStart").addEventListener("click",startQueue);
document.addEventListener("click",e=>{const m=$("moreMenu");if(!m.open)return;if(!m.contains(e.target)||e.target.closest(".menu-pop button"))setTimeout(()=>{m.open=false},0)});
document.querySelectorAll(".nav-item").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x===a))}));
renderGoal();
updateStats();
