(() => {
'use strict';
const box=document.getElementById('weather-alerts');
const link='https://www.aemet.es/es/eltiempo/prediccion/avisos';
let current=null,busy=false,last=0;
function render(data,failed=false){
 const now=Date.now(), stamp=Date.parse(data?.lastSuccessAt);
 const stale=failed||data?.status!=='ok'||!Number.isFinite(stamp)||now-stamp>90*60000||stamp>now+5*60000;
 const alerts=(data?.alerts||[]).filter(a=>['amarillo','naranja','rojo'].includes(a.level)&&Date.parse(a.expires)>now&&Number.isFinite(Date.parse(a.onset)));
 const message=stale?'Avisos oficiales sin confirmar':alerts.length?'⚠ Hay avisos oficiales en tu zona':'Sin avisos oficiales en tu zona';
 box.innerHTML='<span>'+message+'</span> · <a href="'+link+'" target="_blank" rel="noopener">Consultar avisos en AEMET ↗</a>';
}
async function refresh(force=false){
 if(busy||(!force&&Date.now()-last<5*60000))return;
 busy=true;last=Date.now();
 try{const response=await fetch('alerts.json',{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP');const data=await response.json();if(data.schema!==1||data.zone!==box.dataset.zone||!Array.isArray(data.alerts)||data.alerts.some(a=>a.zone!==data.zone||!['amarillo','naranja','rojo'].includes(a.level)||!Number.isFinite(Date.parse(a.onset))||!Number.isFinite(Date.parse(a.expires))||Date.parse(a.onset)>Date.parse(a.expires)))throw Error('Datos');current=data;render(data)}catch{render(current,true)}finally{busy=false}
}
document.getElementById('weather-refresh').addEventListener('click',()=>refresh(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render(current,true);refresh(true)}});
window.addEventListener('online',()=>refresh(true));
setInterval(()=>{if(!document.hidden){if(current)render(current);refresh()}},60000);
refresh(true);
})();
