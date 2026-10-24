(() => {
  'use strict';
  let initialized=false;
  const $=id=>document.getElementById(id);
  const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function init(){
    if(initialized)return;
    if(!window.L||!window.topojson){$('atlas-status').textContent='No se ha podido cargar el mapa. Comprueba la conexión y recarga.';return}
    initialized=true;
    const map=L.map('map',{zoomControl:false,minZoom:6,maxZoom:18}).setView([39.90199,-3.62517],11);
    L.control.zoom({position:'topright'}).addTo(map);
    L.control.scale({imperial:false}).addTo(map);
    const arc='© Esri, USGS y colaboradores';
    const base={topo:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:arc,maxZoom:18}),osm:L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}),sat:L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:arc,maxZoom:18})};
    let selected='topo';base.topo.addTo(map);
    const points=L.layerGroup().addTo(map),labels=L.layerGroup(),borders=L.layerGroup();
    let towns=[{name:'Yepes',lat:39.90199,lon:-3.62517,exact:true}],bounds=null;
    const markers=new Map();
    function select(town){map.setView([town.lat,town.lon],13);markers.get(town.name)?.openPopup();$('sidebar').classList.add('collapsed');$('mobileToggle').setAttribute('aria-expanded','false')}
    function renderList(){
      const query=norm($('townSearch').value);
      const filtered=towns.filter(t=>norm(t.name).includes(query));
      $('entries').innerHTML=filtered.map(t=>`<button class="entry" data-town="${esc(t.name)}"><span class="entry-dot"></span><span class="entry-name">${esc(t.name)}</span></button>`).join('')||'<p>Sin resultados.</p>';
    }
    function renderPoints(){
      points.clearLayers();labels.clearLayers();markers.clear();
      towns.forEach(t=>{
        const marker=L.circleMarker([t.lat,t.lon],{radius:t.exact?7:4,color:'#fff',weight:1,fillColor:t.exact?'#a76621':'#267754',fillOpacity:1}).addTo(points);
        marker.bindPopup(`<strong>${esc(t.name)}</strong><p>${t.exact?'Coordenada municipal de Yepes.':'Centro aproximado del término municipal; puede no coincidir con el casco urbano.'}</p>`).bindTooltip(t.name);
        markers.set(t.name,marker);
        if(t.exact||map.getZoom()>=11)L.marker([t.lat,t.lon],{interactive:false,icon:L.divIcon({className:'sat-town-label',html:'<span>'+esc(t.name)+'</span>',iconSize:[0,0],iconAnchor:[-8,8]})}).addTo(labels);
      });
      if(selected==='sat')labels.addTo(map);else map.removeLayer(labels);
      renderList();
    }
    $('entries').addEventListener('click',e=>{const row=e.target.closest('[data-town]');if(row)select(towns.find(t=>t.name===row.dataset.town))});
    $('townSearch').addEventListener('input',renderList);
    $('focusYepes').addEventListener('click',()=>select(towns.find(t=>t.exact)));
    $('resetView').addEventListener('click',()=>bounds?map.fitBounds(bounds):map.setView([39.90199,-3.62517],11));
    $('toggleMunicipal').addEventListener('change',e=>e.target.checked?borders.addTo(map):map.removeLayer(borders));
    $('mobileToggle').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('collapsed')===false;$('mobileToggle').setAttribute('aria-expanded',String(open))});
    document.querySelectorAll('[data-base]').forEach(button=>button.addEventListener('click',()=>{
      map.removeLayer(base[selected]);selected=button.dataset.base;base[selected].addTo(map);base[selected].bringToBack();
      document.querySelectorAll('[data-base]').forEach(b=>b.classList.toggle('active',b===button));renderPoints();
    }));
    map.on('zoomend',renderPoints);window.addEventListener('resize',()=>map.invalidateSize());
    renderPoints();
    (async()=>{
      try{
        const response=await fetch('https://cdn.jsdelivr.net/npm/es-atlas@0.6.0/es/municipalities.json');
        if(!response.ok)throw Error(response.status);
        const topology=await response.json();
        const province=topojson.feature(topology,topology.objects.provinces).features.find(f=>String(f.id).padStart(2,'0')==='45');
        if(!province)throw Error('Sin provincia');
        const outline=L.geoJSON(province,{interactive:false,style:{color:'#a76621',weight:3,fillOpacity:.03}}).addTo(map);bounds=outline.getBounds();
        const municipalities=topojson.feature(topology,topology.objects.municipalities).features.filter(f=>String(f.id).startsWith('45'));
        L.geoJSON({type:'FeatureCollection',features:municipalities},{interactive:false,style:{color:'#277453',weight:.7,fill:false}}).addTo(borders);
        towns=municipalities.map(feature=>{
          const name=feature.properties?.name||String(feature.id);
          if(norm(name)==='yepes')return {name:'Yepes',lat:39.90199,lon:-3.62517,exact:true};
          const b=L.geoJSON(feature).getBounds().getCenter();return{name,lat:b.lat,lon:b.lng,exact:false};
        }).sort((a,b)=>a.name.localeCompare(b.name,'es'));
        if(!towns.some(t=>t.exact))towns.unshift({name:'Yepes',lat:39.90199,lon:-3.62517,exact:true});
        $('atlas-status').textContent=towns.length+' municipios · centros aproximados salvo Yepes';renderPoints();
      }catch(error){$('atlas-status').textContent='Yepes localizado · no se pudieron cargar los límites y municipios. Comprueba tu conexión.'}
    })();
  }
  document.querySelector('[data-page="atlas"]').addEventListener('click',init);
})();
