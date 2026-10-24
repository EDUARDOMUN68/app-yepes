(() => {
  'use strict';
  let pending=null;
  const button=()=>document.getElementById('install-app');
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();pending=event;
    if(button())button().hidden=false;
  });
  window.addEventListener('appinstalled',()=>{
    pending=null;if(button())button().hidden=true;
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const control=button();
    if(!control)return;
    control.hidden=!pending;
    control.addEventListener('click',async()=>{
      if(!pending)return;
      const prompt=pending;pending=null;control.hidden=true;
      try{await prompt.prompt();await prompt.userChoice}catch(error){console.warn('No se pudo mostrar la instalación',error)}
    });
  });
  if('serviceWorker' in navigator){
    let reloading=false;
    const hadController=Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(hadController&&!reloading){reloading=true;window.location.reload()}
    });
    let registration;
    const check=async()=>{
      try{
        registration=registration||await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
        if(registration.waiting)registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
        await registration.update();
      }catch(error){console.warn('No se pudo comprobar la actualización',error)}
    };
    window.addEventListener('load',()=>{
      check();
    });
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
  }
})();

