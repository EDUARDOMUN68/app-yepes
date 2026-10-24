(() => {
  'use strict';
  const page=document.getElementById('weather-page');
  const hint=document.getElementById('pull-refresh');
  let start=null,distance=0,refreshing=false;
  const reset=()=>{start=null;distance=0;if(!refreshing)hint.hidden=true};
  page.addEventListener('touchstart',event=>{
    reset();
    if(!refreshing&&page.scrollTop<=0&&event.touches.length===1&&!event.target.closest('button,input,a,iframe,.weather-table-wrap')){
      start={x:event.touches[0].clientX,y:event.touches[0].clientY};
    }
  },{passive:true});
  page.addEventListener('touchmove',event=>{
    if(!start)return;
    if(event.touches.length!==1||page.scrollTop>0){reset();return}
    const dx=event.touches[0].clientX-start.x;
    distance=event.touches[0].clientY-start.y;
    if(Math.abs(dx)>35||distance<0){reset();return}
    if(distance>12){
      if(event.cancelable)event.preventDefault();
      hint.hidden=false;hint.textContent=distance>=85?'Suelta para actualizar':'Desliza hacia abajo para actualizar';
    }
  },{passive:false});
  page.addEventListener('touchcancel',reset,{passive:true});
  page.addEventListener('touchend',async()=>{
    if(!start||distance<85){reset();return}
    refreshing=true;hint.hidden=false;hint.textContent='Actualizando la app…';start=null;
    try{
      if('serviceWorker' in navigator){
        const registration=await navigator.serviceWorker.getRegistration();
        if(registration){
          await registration.update();
          if(registration.installing){
            const worker=registration.installing;
            await Promise.race([new Promise(resolve=>worker.addEventListener('statechange',()=>{if(['installed','activated','redundant'].includes(worker.state))resolve()})),new Promise(resolve=>setTimeout(resolve,5000))]);
          }
          if(registration.waiting){
            const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
            registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
            await Promise.race([changed,new Promise(resolve=>setTimeout(resolve,2500))]);
          }
        }
      }
    }catch(error){console.warn('No se pudo comprobar una versión nueva',error)}
    try{localStorage.removeItem('yepes-weather-v2')}catch{}
    window.location.reload();
  },{passive:true});
})();

