import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const PROFILE='aytoyepes';
const SOURCE=`https://www.instagram.com/${PROFILE}/embed/`;
const normalized=text=>text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const day=timestamp=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp*1000));
export function parseProfile(html){
  const profiles=[];
  const walk=(value,depth=0)=>{
    if(depth>40||!value)return;
    if(typeof value==='string'){
      if(value.startsWith('{')||value.startsWith('[')){try{walk(JSON.parse(value),depth+1)}catch{}}
      return;
    }
    if(typeof value!=='object')return;
    if(value.username===PROFILE&&Array.isArray(value.graphql_media))profiles.push(value);
    for(const child of Object.values(value))walk(child,depth+1);
  };
  // El visor público incluye su contenido como cadenas JSON; nunca se ejecuta código de la fuente.
  for(const match of html.matchAll(/"(?:\\.|[^"\\])*"/g)){
    try{walk(JSON.parse(match[0]))}catch{}
  }
  const profile=profiles.sort((a,b)=>b.graphql_media.length-a.graphql_media.length)[0];
  if(!profile?.graphql_media.length)throw Error('Instagram no ofrece publicaciones públicas en esta consulta');
  const posts=[];
  for(const entry of profile.graphql_media){
    const media=entry.shortcode_media;
    const text=media?.edge_media_to_caption?.edges?.[0]?.node?.text;
    if(media?.owner?.username!==PROFILE||!/^[-\w]+$/.test(media.shortcode||'')||typeof text!=='string'||!Number.isFinite(media.taken_at_timestamp))continue;
    const lines=text.normalize('NFKC').split(/\n+/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
    const title=lines[0]?.replace(/^[^\p{L}\p{N}]+/u,'').slice(0,130);
    if(!title)continue;
    const summary=lines.slice(1).filter(s=>!/^#/.test(s)).join(' ').slice(0,160).replace(/\s+\S*$/,'')+'…';
    const item={id:'instagram-'+media.shortcode,title,summary,publishedDate:day(media.taken_at_timestamp),source:'Ayuntamiento de Yepes · Instagram @aytoyepes',url:`https://www.instagram.com/p/${media.shortcode}/`,automatic:true};
    try{
      const image=new URL(media.display_url);
      if(image.protocol==='https:'&&/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(image.hostname))item.imageUrl=image.href;
    }catch{}
    // Solo fecha de evento explícita: sin deducir la caducidad a partir de la fecha del post.
    const explicit=text.normalize('NFKC').match(/(?:fecha\s*:\s*|el d[ií]a\s+|\b)(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i);
    if(explicit&&!/\b(?:del|al|hasta|desde)\b/i.test(text)){
      const month=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'].indexOf(explicit[2].toLowerCase())+1;
      const year=Number(item.publishedDate.slice(0,4));
      const iso=`${year}-${String(month).padStart(2,'0')}-${explicit[1].padStart(2,'0')}`;
      const eventDate=new Date(iso+'T12:00:00Z');
      if(Number.isFinite(eventDate.getTime())&&eventDate.toISOString().slice(0,10)===iso&&iso>=item.publishedDate)item.eventEnd=iso;
    }
    posts.push(item);
  }
  if(!posts.length)throw Error('No se pudieron validar publicaciones del perfil oficial');
  return posts;
}
export function mergePosts(previous,received,overrides){
  const titlesByUrl=new Map(received.map(item=>[item.url,normalized(item.title)]));
  const overrideUrls=new Set(overrides.map(item=>item.url));
  const byUrl=new Map(previous.map(item=>[item.url,item]));
  for(const item of received)byUrl.set(item.url,{...byUrl.get(item.url),...item});
  for(const item of overrides)byUrl.set(item.url,{...byUrl.get(item.url),...item});
  const seen=new Set();
  return [...byUrl.values()].sort((a,b)=>b.publishedDate.localeCompare(a.publishedDate)||Number(overrideUrls.has(b.url))-Number(overrideUrls.has(a.url))).filter(item=>{
    const key=titlesByUrl.get(item.url)||normalized(item.title);
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).slice(0,40);
}
export async function updateSocial(){
  const target=new URL('../news-social.json',import.meta.url);
  const previous=await fs.readFile(target,'utf8').then(JSON.parse).catch(()=>({items:[]}));
  const overrides=await fs.readFile(new URL('../social-overrides.json',import.meta.url),'utf8').then(JSON.parse);
  const at=new Date().toISOString();
  try{
    const response=await fetch(SOURCE,{signal:AbortSignal.timeout(35000),headers:{'Accept':'text/html'}});
    if(!response.ok)throw Error('Instagram HTTP '+response.status);
    const received=parseProfile(await response.text());
    const items=mergePosts(previous.items||[],received,overrides.items||[]);
    await fs.writeFile(target,JSON.stringify({source:SOURCE,checkedAt:at,lastAttemptAt:at,status:'ok',receivedCount:received.length,items},null,2)+'\n');
    console.log(`Instagram público comprobado: ${received.length} publicaciones recibidas; ${items.length} noticias únicas conservadas.`);
  }catch(error){
    await fs.writeFile(target,JSON.stringify({...previous,source:SOURCE,lastAttemptAt:at,status:'unavailable',error:'No se ha podido consultar el perfil público. Se conserva la última selección.'},null,2)+'\n');
    console.error('No se actualizó Instagram: '+error.message);
    process.exitCode=0; // Fuente social opcional: el estado público informa de su indisponibilidad.
  }
}
if(process.argv[1]===fileURLToPath(import.meta.url))await updateSocial();



