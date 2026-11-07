import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../alerts.js',import.meta.url),'utf8');
async function view(mode){
 const now=Date.now();const box={dataset:{zone:'670503',area:'Sur de Ávila',municipality:'Sotillo'},innerHTML:''};
 const alert={zone:'670503',level:'naranja',headline:'Lluvias <script>',description:'80 mm',onset:new Date(now+3600000).toISOString(),expires:new Date(now+7200000).toISOString()};
 const data={schema:1,zone:'670503',status:'ok',lastSuccessAt:new Date(now).toISOString(),alerts:[alert]};
 if(mode==='empty')data.alerts=[];
 if(mode==='expired')data.alerts[0].expires=new Date(now-1000).toISOString(),data.alerts[0].onset=new Date(now-2000).toISOString();
 if(mode==='stale')data.lastSuccessAt=new Date(now-100*60000).toISOString();
 if(mode==='failure')data.status='unavailable';
 const context={Date,AbortSignal,setInterval:()=>{},window:{addEventListener(){}},document:{getElementById:id=>id==='weather-alerts'?box:{addEventListener(){}},addEventListener(){}},fetch:async()=>({ok:true,json:async()=>data})};
 vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));return box.innerHTML;
}
test('aviso futuro se resume en una línea con enlace oficial',async()=>{const html=await view('normal');assert.match(html,/Hay avisos oficiales en tu zona/);assert.match(html,/Consultar avisos en AEMET/);assert.doesNotMatch(html,/<article|<h2|80 mm|script&gt;/)});
test('vacío y expirado muestran ausencia con consulta reciente correcta',async()=>{for(const mode of ['empty','expired'])assert.match(await view(mode),/Sin avisos oficiales en tu zona/)});
test('error o datos antiguos muestran estado sin confirmar',async()=>{for(const mode of ['failure','stale']){const html=await view(mode);assert.match(html,/Avisos oficiales sin confirmar/);assert.doesNotMatch(html,/Sin avisos oficiales en tu zona/)}});
