import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const WeatherSky=require('../sky-icons.js');
test('el resumen nocturno y las filas usan noche/fase sin cambiar las 36 horas y 14 días',async()=>{
 const first=Date.parse('2026-10-31T00:00:00Z')/1000;
 const now=Date.parse('2026-10-31T19:15:00Z');
 class Clock extends Date{static now(){return now}}
 const keys=['temperature_2m','relative_humidity_2m','apparent_temperature','precipitation','cloud_cover','wind_speed_10m','wind_gusts_10m','wind_direction_10m','weather_code','is_day'];
 const hourly={time:Array.from({length:336},(_,i)=>first+i*3600)};
 keys.forEach(key=>hourly[key]=hourly.time.map(t=>key==='is_day'?(new Date(t*1000).getUTCHours()>=7&&new Date(t*1000).getUTCHours()<17?1:0):key==='weather_code'?0:10));
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',addEventListener(){}});return elements.get(id)};
 let request;
 vm.runInNewContext(fs.readFileSync(new URL('../weather.js',import.meta.url),'utf8'),{
  WeatherSky,document:{getElementById:get,querySelectorAll:()=>[],addEventListener(){},hidden:false},window:{addEventListener(){}},navigator:{},
  localStorage:{getItem:()=>null,setItem(){}},fetch:async url=>{request=url;return {ok:true,json:async()=>({hourly})}},
  AbortSignal,Date:Clock,Intl,URLSearchParams,Map,Number,String,Object,Math,JSON,setInterval(){}
 });
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(request,/is_day/);
 assert.match(get('weather-now').innerHTML,/Noche/);assert.match(get('weather-now').innerHTML,/Luna gibosa menguante/);assert.doesNotMatch(get('weather-now').innerHTML,/☀|🌤|🌦/);
 const rows=get('weather-hours').innerHTML.match(/<tr>[\s\S]*?<\/tr>/g);
 assert.equal(rows.length,36);assert.doesNotMatch(rows[0],/☀|🌤|🌦/);assert.match(rows[0],/data-period="night"/);
 assert.ok(rows.some(row=>/data-period="day"/.test(row)&&/☀/.test(row)));
 assert.equal((get('weather-days').innerHTML.match(/day-card/g)||[]).length,14);
});
