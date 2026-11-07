(() => {
'use strict';
const box=document.getElementById('weather-alerts');
const link='https://www.aemet.es/es/eltiempo/prediccion/avisos';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s).toLocaleString('es-ES',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
let current=null,busy=false,last=0;
function render(data,failed=false){
 const now=Date.now(), stamp=Date.parse(data?.lastSuccessAt);
 const stale=failed||data?.status!=='ok'||!Number.isFinite(stamp)||now-stamp>90*60000||stamp>now+5*60000;
 const alerts=(data?.alerts||[]).filter(a=>['amarillo','naranja','rojo'].includes(a.level)&&Date.parse(a.expires)>now&&Number.isFinite(Date.parse(a.onset)));
 alerts.sort((a,b)=>({rojo:3,naranja:2,amarillo:1}[b.level]-{rojo:3,naranja:2,amarillo:1}[a.level])||Date.parse(a.onset)-Date.parse(b.onset));
 box.innerHTML='<h2>Avisos oficiales · AEMET</h2><p class="alerts-zone">'+escape(data?.area||box.dataset.area)+' · zona de '+escape(box.dataset.municipality)+'</p>'+
 (stale?'<p class="alerts-unavailable"><strong>No podemos confirmar el estado actual de los avisos.</strong> Consulta AEMET. Los avisos guardados que aparecen pueden haber cambiado.</p>':'')+
 (!alerts.length?'<p>'+(stale?'Sin información vigente confirmada.':'Sin avisos vigentes ni próximos publicados para esta zona en la última consulta.')+'</p>':'')+
 alerts.map(a=>'<article class="aemet-alert level-'+a.level+'"><h3>⚠ Nivel '+escape(a.level)+' · '+(Date.parse(a.onset)>now?'Próximo':'En vigor')+'</h3><p><strong>'+escape(a.headline)+'</strong></p><p>Desde '+date(a.onset)+' hasta '+date(a.expires)+' · hora peninsular</p><p>'+escape(a.description)+'</p>'+(a.probability?'<p>Probabilidad: '+escape(a.probability)+'</p>':'')+(a.instruction?'<p>'+escape(a.instruction)+'</p>':'')+'</article>').join('')+
 '<p class="weather-note">'+(Number.isFinite(stamp)?'Última consulta correcta: '+date(data.lastSuccessAt)+'. ':'')+'Fuente: AEMET. Se comprueba aproximadamente cada 20 minutos; puede haber retrasos.</p><p class="weather-note">El aviso abarca toda la zona y puede señalar riesgos localizados o acumulados de varias horas. La previsión ECMWF es para el entorno del pueblo: una cantidad menor no anula un aviso oficial.</p><a href="'+link+'" target="_blank" rel="noopener">Consultar avisos en AEMET ↗</a>';
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
