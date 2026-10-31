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
  function icon(code,isDay=1,timestamp){
    if(!Number.isFinite(code))return '—';
    const night=isDay===0;
    const lunar=night?moon(timestamp):null;
    const symbol=code===0?(night?lunar.emoji:isDay===1?'☀️':'◯')
      :code<=2?(night?lunar.emoji+'☁️':isDay===1?'🌤️':'☁️')
      :code===3?'☁️':code<=48?'🌫️':code<=67?'🌧️':code<=77?'❄️'
      :code<=82?(isDay===1?'🌦️':'🌧️'):code<=86?'❄️':code>=95?'⛈️':'—';
    const label=night?'Noche · '+lunar.name:isDay===1?'Día':'Día o noche sin datos';
    // Solo contenido calculado localmente; sin texto de proveedores en el HTML del icono.
    return '<span class="weather-sky-icon" role="img" aria-label="'+label+'" title="'+label+'" data-period="'+(night?'night':'day')+'">'+symbol+'</span>';
  }
  function phaseText(isDay,timestamp){return isDay===0?moon(timestamp).name:''}
  return {moon,icon,phaseText};
});
