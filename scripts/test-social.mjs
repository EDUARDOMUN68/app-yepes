import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProfile,mergePosts} from './update-social.mjs';
const post=(code,text,owner='aytoyepes')=>({shortcode_media:{shortcode:code,owner:{username:owner},taken_at_timestamp:1792686966,edge_media_to_caption:{edges:[{node:{text}}]},display_url:'https://scontent.cdninstagram.com/public-poster.jpg'}});
const html=media=>'<script>data='+JSON.stringify(JSON.stringify({username:'aytoyepes',graphql_media:media}))+'</script>';
test('lee JSON público sin ejecutar scripts y valida autor, fecha y cartel',()=>{
 const items=parseProfile(html([post('ABC123','Robótica Halloween\nFecha: 30 de octubre\nBiblioteca municipal')]));
 assert.equal(items.length,1);assert.equal(items[0].publishedDate,'2026-10-22');assert.equal(items[0].eventEnd,'2026-10-30');assert.equal(items[0].url,'https://www.instagram.com/p/ABC123/');assert.ok(items[0].imageUrl);
});
test('no inventa caducidad ni admite publicaciones de otra cuenta',()=>{
 const items=parseProfile(html([post('ABC123','Curso de formación\nPlazas limitadas'),post('OTHER','Anuncio ajeno','otra_cuenta')]));
 assert.equal(items.length,1);assert.equal(items[0].eventEnd,undefined);
 assert.throws(()=>parseProfile('<html>Inicia sesión</html>'));
});
test('agrupa duplicados conservando correcciones manuales y noticias anteriores',()=>{
 const items=parseProfile(html([post('ABC123','Curso gratuito\nPlazas limitadas'),post('ABC456','Curso gratuito\nOtra publicación')]));
 const overrides=[{...items[0],id:'curso-verificado',title:'Título revisado',eventEnd:'2026-11-01'}];
 const previous=[{id:'tapas',title:'Concurso de tapas',publishedDate:'2026-10-13',url:'https://www.instagram.com/p/OLD/'}];
 const merged=mergePosts(previous,items,overrides);
 assert.equal(merged.length,2);assert.equal(merged[0].title,'Título revisado');assert.equal(merged[0].eventEnd,'2026-11-01');assert.ok(merged.some(x=>x.id==='tapas'));
});

