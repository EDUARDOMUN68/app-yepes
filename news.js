(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let loadedAt=0;
  const today=()=>{
    const parts=Object.fromEntries(new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const active=item=>!/^\d{4}-\d{2}-\d{2}$/.test(item.eventEnd||'')||item.eventEnd>=today();
  async function loadHighlights(){
    try{
      const response=await fetch('./news-social.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error(response.status);
      const data=await response.json();
      if(!Array.isArray(data.items))throw Error('Publicaciones no disponibles');
      const checked=new Date(data.checkedAt);
      const valid=Number.isFinite(checked.getTime());
      const stale=!valid||Date.now()-checked.getTime()>24*3600000;
      $('news-social-status').textContent=data.status!=='ok'||stale
        ? 'No se ha podido obtener una consulta reciente de Instagram. Se conservan las noticias anteriores; puedes abrir el perfil oficial.'
        : 'Instagram consultado automáticamente el '+checked.toLocaleString('es-ES',{timeZone:'Europe/Madrid'})+'. Se consultan las seis publicaciones recientes del visor público.';
      const seen=new Set();
      const cards=data.items.filter(active).filter(item=>{if(!item.id||seen.has(item.id))return false;seen.add(item.id);return true}).map(item=>{
        const url=new URL(item.url);
        if(!['https://www.instagram.com','https://x.com','https://www.facebook.com'].includes(url.origin))throw Error('Red inesperada');
        const article=document.createElement('article');article.className='news-card';
        const title=document.createElement('h2');title.textContent=item.title;
        const source=document.createElement('p');source.textContent=item.source;
        const date=document.createElement('p');date.textContent='Publicación: '+new Date(item.publishedDate+'T12:00:00Z').toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'});
        const summary=document.createElement('p');summary.className='news-summary';summary.textContent=item.summary;
        const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener';link.textContent='Ver publicación original ↗';
        if(item.imageUrl){
          try{
            const imageUrl=new URL(item.imageUrl);
            if(imageUrl.protocol==='https:'&&/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(imageUrl.hostname)){
              const image=document.createElement('img');image.src=imageUrl.href;image.alt='Cartel de la publicación: '+item.title;image.className='news-poster';image.loading='lazy';image.referrerPolicy='no-referrer';
              image.addEventListener('error',()=>image.remove());article.append(image);
            }
          }catch{}
        }
        article.append(title,source,date,summary,link);return article;
      });
      $('news-highlights').replaceChildren(...cards);
      if(!cards.length)$('news-highlights').textContent='No hay actividades destacadas vigentes en esta selección. Puedes consultar nuevas publicaciones en las redes de abajo.';
    }catch(error){$('news-social-status').textContent='No se pudieron actualizar las publicaciones de redes.';$('news-highlights').textContent='Consulta el perfil municipal en los enlaces de abajo.'}
  }
  async function loadNews(){
    if(Date.now()-loadedAt<60000)return;
    loadHighlights();
    $('news-status').textContent='Consultando noticias municipales…';
    try{
      const response=await fetch('./news.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error(response.status);
      const data=await response.json();
      if(!Array.isArray(data.items)||!data.items.length)throw Error('Sin titulares');
      const cards=data.items.filter(active).map(item=>{
        const url=new URL(item.url);
        if(url.origin!=='https://www.yepes.es')throw Error('Fuente inesperada');
        const article=document.createElement('article');article.className='news-card';
        const heading=document.createElement('h2');heading.textContent=item.title;
        const source=document.createElement('p');source.textContent='Ayuntamiento de Yepes';
        const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener';link.textContent='Leer en la web municipal ↗';
        article.append(heading,source,link);return article;
      });
      $('news-items').replaceChildren(...cards);loadedAt=Date.now();
      const date=new Date(data.checkedAt);
      if(!Number.isFinite(date.getTime()))throw Error('Fecha inválida');
      const stale=Date.now()-date.getTime()>24*3600000;
      $('news-status').textContent=`${stale?'Información pendiente de actualizar. ':''}Portada municipal consultada el ${date.toLocaleString('es-ES',{timeZone:'Europe/Madrid'})}. Esta fecha indica la consulta, no la publicación de los anuncios.`;
    }catch(error){$('news-status').textContent='No se pudo actualizar la portada. Puedes consultar directamente la web y las redes oficiales en los enlaces de abajo.'}
  }
  document.querySelectorAll('[data-page="news"]').forEach(b=>b.addEventListener('click',loadNews));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('news-page').hidden){loadedAt=0;loadNews()}});
  setInterval(()=>{if(!document.hidden&&!$('news-page').hidden)loadNews()},60000);
  $('news-refresh').addEventListener('click',()=>{loadedAt=0;loadNews()});
  $('news-facebook-load').addEventListener('click',()=>{
    const iframe=document.createElement('iframe');iframe.title='Publicaciones del Ayuntamiento en Facebook';iframe.className='news-facebook';
    iframe.src='https://www.facebook.com/plugins/page.php?'+new URLSearchParams({href:'https://www.facebook.com/ayuntamientoyepes/',tabs:'timeline',width:'340',height:'600',small_header:'true',adapt_container_width:'true',hide_cover:'false',show_facepile:'false'});
    $('news-facebook').replaceChildren(iframe);$('news-facebook-load').hidden=true;
  });
})();

