"""Avisos oficiales AEMET: índice RSS actual y mensajes CAP 1.2, sin claves."""
import json, sys, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'alerts-config.json').read_text(encoding='utf-8'))
FEED = 'https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAE_wah_RSS.xml'
NS = {'c': 'urn:oasis:names:tc:emergency:cap:1.2'}

def download(url):
    if not url.startswith('https://www.aemet.es/'):
        raise ValueError('Origen de aviso no permitido')
    req = urllib.request.Request(url, headers={'User-Agent': 'MunicipalWeatherAlerts/1.0'})
    with urllib.request.urlopen(req, timeout=40) as response:
        if not response.url.startswith('https://www.aemet.es/'):
            raise ValueError('Redirección fuera de AEMET')
        return response.read()

def parse_cap(xml, zone, now):
    root = ET.fromstring(xml)
    def text(node, name): return (node.findtext('c:' + name, '', NS) or '').strip()
    if root.tag != '{'+NS['c']+'}alert': raise ValueError('CAP inválido')
    if text(root, 'status') != 'Actual' or text(root, 'scope') != 'Public': return []
    if text(root, 'msgType') == 'Cancel': return []
    result = []
    for info in root.findall('c:info', NS):
        if not text(info, 'language').startswith('es'): continue
        areas = [a for a in info.findall('c:area', NS) if any(text(g,'valueName') == 'AEMET-Meteoalerta zona' and text(g,'value') == zone for g in a.findall('c:geocode',NS))]
        if not areas: continue
        onset, expires = text(info,'onset'), text(info,'expires')
        start, end = datetime.fromisoformat(onset), datetime.fromisoformat(expires)
        if start.tzinfo is None or end.tzinfo is None or start > end: raise ValueError('Fechas CAP inválidas')
        if end <= now: continue
        params = {text(p,'valueName'):text(p,'value') for p in info.findall('c:parameter',NS)}
        level = params.get('AEMET-Meteoalerta nivel','').lower()
        if level not in ('amarillo','naranja','rojo'): continue
        result.append(dict(id=text(root,'identifier'), sent=text(root,'sent'), level=level,
            headline=text(info,'headline'), description=text(info,'description'), instruction=text(info,'instruction'),
            probability=params.get('AEMET-Meteoalerta probabilidad',''), onset=onset, expires=expires,
            zone=zone, area=text(areas[0],'areaDesc')))
    return result

def collect():
    now = datetime.now(timezone.utc)
    root = ET.fromstring(download(FEED))
    channel = root.find('channel')
    if root.tag != 'rss' or channel is None or 'AEMET' not in channel.findtext('title','') or not channel.findtext('lastBuildDate'):
        raise ValueError('Índice RSS inválido')
    links = set()
    for item in channel.findall('item'):
        if CONFIG['area'].casefold() in item.findtext('title','').casefold():
            link = item.findtext('link','')
            if '/avisos/cap/' not in link: raise ValueError('Enlace CAP inválido')
            links.add(link)
    alerts = []
    for link in sorted(links): alerts.extend(parse_cap(download(link), CONFIG['zone'], now))
    unique = {a['id']:a for a in alerts}
    return dict(schema=1, zone=CONFIG['zone'], area=CONFIG['area'], municipality=CONFIG['municipality'],
        checkedAt=now.isoformat(), lastSuccessAt=now.isoformat(), status='ok', source=FEED,
        alerts=sorted(unique.values(),key=lambda a:(a['onset'],a['id'])))

def main():
    path = ROOT / 'alerts.json'
    try:
        result = collect()
    except Exception as error:
        try: result = json.loads(path.read_text(encoding='utf-8'))
        except (OSError,ValueError): result = dict(schema=1, zone=CONFIG['zone'], area=CONFIG['area'], municipality=CONFIG['municipality'], lastSuccessAt=None, alerts=[])
        result.update(status='unavailable', checkedAt=datetime.now(timezone.utc).isoformat())
        print('No se pudo completar la consulta AEMET; se conserva el último estado:', type(error).__name__, file=sys.stderr)
        path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        return 1
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"AEMET {result['area']}: {len(result['alerts'])} avisos vigentes o próximos")
    return 0

if __name__ == '__main__': sys.exit(main())
