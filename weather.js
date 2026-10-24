(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const zone = 'Europe/Madrid';
  const fmt = (t, opts) => new Intl.DateTimeFormat('es-ES', {timeZone:zone,...opts}).format(new Date(t*1000));
  const dayKey = t => fmt(t,{year:'numeric',month:'2-digit',day:'2-digit'});
  const n = (v, unit='', digits=0) => Number.isFinite(v) ? v.toLocaleString('es-ES',{maximumFractionDigits:digits})+unit : '—';
  const mean = a => a.length ? a.reduce((s,v)=>s+v,0)/a.length : null;
  const values = (rows,key) => rows.map(r=>r[key]).filter(Number.isFinite);
  const describe = c => !Number.isFinite(c)?'Sin datos':c===0?'Despejado':c<=2?'Poco nuboso':c===3?'Cubierto':c<=48?'Niebla':c<=57?'Llovizna':c<=67?'Lluvia':c<=77?'Nieve':c<=82?'Chubascos':c<=86?'Chubascos de nieve':c>=95?'Tormenta':'Sin datos';
  const icon = c => !Number.isFinite(c)?'—':c===0?'☀️':c<=2?'🌤️':c===3?'☁️':c<=48?'🌫️':c<=67?'🌧️':c<=77?'❄️':c<=82?'🌦️':c<=86?'❄️':c>=95?'⛈️':'—';
  const wind = degrees => {
    if(!Number.isFinite(degrees))return '—';
    const angle=((degrees%360)+360)%360;
    const from=['N','NE','E','SE','S','SO','O','NO'][Math.round(angle/45)%8];
    return `<span class="wind-direction" title="Viento del ${from}; la flecha indica hacia dónde sopla" aria-label="Viento del ${from}"><svg aria-hidden="true" class="wind-arrow" viewBox="0 0 24 24" style="transform:rotate(${angle+180}deg)"><path d="M12 21V3M4 11l8-8 8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg> ${from}</span>`;
  };
  const variables=['temperature_2m','relative_humidity_2m','apparent_temperature','precipitation','cloud_cover','wind_speed_10m','wind_gusts_10m','wind_direction_10m','weather_code'];
  const url = 'https://api.open-meteo.com/v1/ecmwf?'+new URLSearchParams({latitude:'39.90199',longitude:'-3.62517',hourly:variables.join(','),models:'ecmwf_ifs',forecast_days:'14',timezone:zone,timeformat:'unixtime',wind_speed_unit:'kmh'});
  const cacheKey='yepes-weather-v2';
  let saved=null, busy=false;
  function rows(data){
    const h=data.hourly;
    if(!h || !Array.isArray(h.time) || !h.time.length || variables.some(k=>!Array.isArray(h[k]) || h[k].length!==h.time.length)) throw Error('Respuesta meteorológica incompleta');
    return h.time.map((time,i)=>Object.fromEntries([['time',time],...variables.map(k=>[k,h[k][i]])]));
  }
  function render(record){
    const all=rows(record.data), now=Date.now()/1000;
    const next=all.filter(r=>r.time>=Math.floor(now/3600)*3600).slice(0,36);
    const r=next[0];
    if(!r)throw Error('La previsión guardada ha caducado');
    $('weather-now').innerHTML=`<div><span class="weather-kicker">Previsión para ${fmt(r.time,{weekday:'long',hour:'2-digit',minute:'2-digit'})}</span><h2>${icon(r.weather_code)} ${n(r.temperature_2m,' °C')}</h2><p>${describe(r.weather_code)} · Sensación ${n(r.apparent_temperature,' °C')}</p></div><div class="weather-metrics"><p><strong>${n(r.relative_humidity_2m,' %')}</strong><span>Humedad relativa</span></p><p><strong>${n(r.wind_speed_10m,' km/h')}</strong><span>${wind(r.wind_direction_10m)} · rachas ${n(r.wind_gusts_10m,' km/h')}</span></p><p><strong>${n(r.precipitation,' mm',1)}</strong><span>Precipitación en la hora</span></p></div>`;
    const upcoming=next.slice(0,24), rain=values(upcoming,'precipitation'), hum=values(upcoming,'relative_humidity_2m'), cloud=values(upcoming,'cloud_cover');
    const wet=upcoming.find(x=>Number.isFinite(x.precipitation)&&x.precipitation>=.1);
    $('weather-summary').textContent=`Próximas 24 horas: ${wet?'se prevé precipitación desde las '+fmt(wet.time,{weekday:'short',hour:'2-digit',minute:'2-digit'}):rain.length===upcoming.length?'sin precipitación prevista':'precipitación no disponible'}. Humedad entre ${hum.length?n(Math.min(...hum),' %'):'—'} y ${hum.length?n(Math.max(...hum),' %'):'—'}. Nubosidad media ${n(mean(cloud),' %')}. Resumen automático a partir de la previsión.`;
    $('weather-hours').innerHTML=next.map(x=>`<tr><th scope="row">${fmt(x.time,{weekday:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</th><td>${icon(x.weather_code)} ${describe(x.weather_code)}</td><td>${n(x.temperature_2m,'°')}</td><td>${n(x.apparent_temperature,'°')}</td><td>${n(x.relative_humidity_2m,' %')}</td><td>${n(x.precipitation,' mm',1)}</td><td>${n(x.cloud_cover,' %')}</td><td>${wind(x.wind_direction_10m)} ${n(x.wind_speed_10m,' km/h')} / ${n(x.wind_gusts_10m,' km/h')}</td></tr>`).join('');
    const groups=new Map();
    all.forEach(x=>{const k=dayKey(x.time);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)});
    $('weather-days').innerHTML=[...groups.values()].slice(0,14).map((g,i)=>{
      const temp=values(g,'temperature_2m'), humidity=values(g,'relative_humidity_2m'), rain=values(g,'precipitation');
      const codes=values(g,'weather_code');const code=codes.length?Math.max(...codes):null;
      return `<article class="day-card"><h3>${fmt(g[0].time,{weekday:'short',day:'numeric',month:'short'})}</h3><p>${icon(code)} ${code===null?'Sin datos':describe(code)}</p><strong>${temp.length?n(Math.max(...temp),'°'):'—'} <span>/ ${temp.length?n(Math.min(...temp),'°'):'—'}</span></strong><p>💧 Humedad media ${n(mean(humidity),' %')}</p><p>Lluvia ${rain.length===g.length?n(rain.reduce((s,v)=>s+v,0),' mm',1):'—'}</p>${i>=7?'<small>Tendencia · mayor incertidumbre</small>':''}</article>`;
    }).join('');
    const stale=Date.now()-record.at>3600000;
    $('weather-status').textContent=`${stale?'Datos guardados · ':''}Descargados el ${new Date(record.at).toLocaleString('es-ES',{timeZone:zone})} · ECMWF IFS 9 km / Open-Meteo. Hora peninsular.`;
  }
  async function refresh(force=false){
    if(busy)return;
    if(!force&&saved&&Date.now()-saved.at<3600000){try{render(saved)}catch{}return}
    busy=true;$('weather-refresh').disabled=true;$('weather-message').textContent='Consultando la previsión…';
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw Error('Servicio no disponible ('+response.status+')');
      const record={at:Date.now(),data:await response.json()};
      render(record);saved=record;
      try{localStorage.setItem(cacheKey,JSON.stringify(record))}catch{}
      $('weather-message').textContent='';
    }catch(e){
      if(saved){try{render(saved)}catch{}}
      $('weather-message').textContent=saved?'No se pudo actualizar. Se conserva la previsión anterior; comprueba su fecha.':'No se pudo obtener la previsión. Comprueba la conexión y pulsa Actualizar. No se muestran datos de ejemplo.';
    }finally{busy=false;$('weather-refresh').disabled=false}
  }
  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{
    const weather=b.dataset.page==='weather';
    $('weather-page').hidden=!weather;$('atlas-page').hidden=b.dataset.page!=='atlas';
    $('news-page').hidden=b.dataset.page!=='news';
    document.querySelectorAll('[data-page]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    if(weather)refresh();else window.dispatchEvent(new Event('resize'));
  }));
  document.querySelectorAll('[data-weather-layer]').forEach(b=>b.addEventListener('click',()=>{
    const descriptions={clouds:['Nubes previstas','Los colores muestran la nubosidad prevista. Las líneas en movimiento representan el viento.'],rain:['Lluvia prevista · escala en mm','Las manchas de colores indican la lluvia prevista según la escala del mapa. Las líneas animadas representan el viento, no gotas de lluvia.'],wind:['Viento previsto · escala en km/h','Los colores indican velocidad y las líneas animadas muestran el movimiento del viento.']};
    $('weather-map-title').textContent=descriptions[b.dataset.weatherLayer][0];
    $('weather-map-explanation').textContent=descriptions[b.dataset.weatherLayer][1];
    $('weather-map').src='https://embed.windy.com/embed.html?'+new URLSearchParams({type:'map',location:'coordinates',lat:'39.90199',lon:'-3.62517',zoom:'8',overlay:b.dataset.weatherLayer,product:'ecmwf',level:'surface',metricTemp:'°C',metricWind:'km/h',metricRain:'mm'});
    document.querySelectorAll('[data-weather-layer]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  }));
  $('weather-refresh').addEventListener('click',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  window.addEventListener('online',()=>refresh());
  setInterval(()=>{if(!document.hidden)refresh()},60000);
  try{const record=JSON.parse(localStorage.getItem(cacheKey));if(record&&Number.isFinite(record.at)){render(record);saved=record}}catch{}
  refresh();

})();





