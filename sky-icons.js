(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/suncalc.js'));
  else root.WeatherSky=factory(root.SunCalc);
})(typeof globalThis!=='undefined'?globalThis:this,function(SunCalc){
  'use strict';
  const phases=[
    ['🌑','Luna nueva'],['🌒','Luna creciente'],['🌓','Cuarto creciente'],['🌔','Luna gibosa creciente'],
    ['🌕','Luna llena'],['🌖','Luna gibosa menguante'],['🌗','Cuarto menguante'],['🌘','Luna menguante']
  ];
  function moon(timestamp){
    if(!Number.isFinite(timestamp)||!SunCalc)return {emoji:'🌙',name:'Fase lunar no disponible',fraction:null};
    const illumination=SunCalc.getMoonIllumination(new Date(timestamp*1000));
    const phase=illumination.phase;
    const index=illumination.fraction<=.02?0:illumination.fraction>=.98?4
      :Math.abs(phase-.25)<=.015?2:Math.abs(phase-.75)<=.015?6
      :phase<.25?1:phase<.5?3:phase<.75?5:7;
    return {emoji:phases[index][0],name:phases[index][1],fraction:illumination.fraction};
  }
  function moonDrawing(lunar){
    const fraction=lunar.fraction===null?.3:lunar.fraction;
    const waxing=/creciente/.test(lunar.name)||lunar.fraction===null;
    const points=[];
    // Disco iluminado blanco; el terminador sigue la fracción lunar calculada.
    for(let i=0;i<=32;i++){
      const y=-9+18*i/32,edge=Math.sqrt(Math.max(0,81-y*y));
      points.push([12+(waxing?edge:-edge),12+y]);
    }
    for(let i=32;i>=0;i--){
      const y=-9+18*i/32,edge=Math.sqrt(Math.max(0,81-y*y));
      points.push([12+(waxing?1:-1)*(1-2*fraction)*edge,12+y]);
    }
    return '<svg class="weather-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="#8895a5"/><polygon points="'+points.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ')+'" fill="#fff"/><circle cx="12" cy="12" r="9" fill="none" stroke="#526174" stroke-width="1.25"/></svg>';
  }
  function icon(code,isDay=1,timestamp){
    if(!Number.isFinite(code))return '—';
    const night=isDay===0;
    const lunar=night?moon(timestamp):null;
    const symbol=code===0?(night?moonDrawing(lunar):isDay===1?'☀️':'◯')
      :code<=2?(night?moonDrawing(lunar)+'☁️':isDay===1?'🌤️':'☁️')
      :code===3?'☁️':code<=48?'🌫️':code<=67?'🌧️':code<=77?'❄️'
      :code<=82?(isDay===1?'🌦️':'🌧️'):code<=86?'❄️':code>=95?'⛈️':'—';
    const label=night?'Noche · '+lunar.name:isDay===1?'Día':'Día o noche sin datos';
    // Solo contenido calculado localmente; sin texto de proveedores en el HTML del icono.
    return '<span class="weather-sky-icon" role="img" aria-label="'+label+'" title="'+label+'" data-period="'+(night?'night':'day')+'">'+symbol+'</span>';
  }
  function phaseText(isDay,timestamp){return isDay===0?moon(timestamp).name:''}
  return {moon,icon,phaseText};
});
