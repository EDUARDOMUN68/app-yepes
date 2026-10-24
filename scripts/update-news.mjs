import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const SOURCE='https://www.yepes.es/';
const clean=value=>value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/\s+/g,' ').trim();
export function parseNews(html){
 const items=[];
 for(const match of html.matchAll(/<article\b[\s\S]*?<\/article>/gi)){
   const block=match[0];
   const heading=block.match(/<h[23][^>]*>[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
   if(!heading||!heading[1].startsWith('/noticias/noticia/'))continue;
   const url=new URL(heading[1],SOURCE).href;
   if(items.some(item=>item.url===url))continue;
   const date=block.match(/<time[^>]*datetime="(\d{2})-(\d{2})-(\d{4})"/i);
   items.push({title:clean(heading[2]),url,...(date?{publishedDate:`${date[3]}-${date[2]}-${date[1]}`}:{})});
 }
 if(!items.length)throw Error('No se han encontrado noticias en la web oficial de Yepes');
 return items.slice(0,8);
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const response=await fetch(SOURCE,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Web municipal HTTP '+response.status);
 const items=parseNews(await response.text());
 const path=new URL('../news.json',import.meta.url);
 const previous=await fs.readFile(path,'utf8').then(JSON.parse).catch(()=>null);
 const now=new Date().toISOString();
 const updatedAt=JSON.stringify(previous?.items)===JSON.stringify(items)?previous.updatedAt:now;
 await fs.writeFile(path,JSON.stringify({source:SOURCE,checkedAt:now,updatedAt,items},null,2)+'\n');
 console.log('Portada oficial Yepes: '+items.length+' noticias.');
}
