import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sky=require('../sky-icons.js');
const at=iso=>Date.parse(iso)/1000;
test('despejado diurno usa sol y nocturno usa luna, también si son fechas futuras',()=>{
 assert.match(sky.icon(0,1,at('2026-10-31T12:00:00Z')),/☀️/);
 const night=sky.icon(0,0,at('2026-10-31T20:00:00Z'));
 assert.doesNotMatch(night,/☀|🌤|🌦/);assert.match(night,/Luna gibosa menguante/);assert.match(night,/weather-moon/);assert.match(night,/fill="#fff"/);
 assert.match(sky.icon(0,0,at('2026-11-24T15:00:00Z')),/Luna llena/);
});
test('fases contrastadas con efemérides USNO de octubre/noviembre 2026',()=>{
 const references=[['2026-10-10T15:50:00Z','Luna nueva'],['2026-10-18T16:12:00Z','Cuarto creciente'],['2026-10-26T04:12:00Z','Luna llena'],['2026-11-01T20:28:00Z','Cuarto menguante']];
 for(const [time,name] of references)assert.equal(sky.moon(at(time)).name,name);
});
test('nubosidad y chubascos nocturnos no introducen sol; sin datos no inventa cielo',()=>{
 for(const code of [1,2,3,45,61,80,81,82,85,95])assert.doesNotMatch(sky.icon(code,0,at('2026-10-31T22:00:00Z')),/☀|🌤|🌦/);
 assert.equal(sky.icon(null,0), '—');assert.match(sky.icon(0,0,NaN),/Fase lunar no disponible/);
 assert.doesNotMatch(sky.icon(0,null,at('2026-10-31T22:00:00Z')),/☀|🌤|🌦/);
 assert.equal(sky.phaseText(1,at('2026-10-31T12:00:00Z')),'');
});
