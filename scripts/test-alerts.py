import importlib.util, unittest
from datetime import datetime, timezone
from unittest.mock import patch
from pathlib import Path
spec=importlib.util.spec_from_file_location('alerts',Path(__file__).with_name('update-alerts.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CAP='''<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>one</identifier><status>Actual</status><scope>Public</scope><msgType>Update</msgType><info><language>es-ES</language><onset>2026-11-09T00:00:00+01:00</onset><expires>2026-11-09T23:59:59+01:00</expires><headline>Lluvias</headline><parameter><valueName>AEMET-Meteoalerta nivel</valueName><value>naranja</value></parameter><area><areaDesc>Sur de Ávila</areaDesc><geocode><valueName>AEMET-Meteoalerta zona</valueName><value>670503</value></geocode></area></info></alert>'''
class Tests(unittest.TestCase):
 def test_future_expired_and_zone(self):
  now=datetime(2026,11,7,tzinfo=timezone.utc)
  self.assertEqual(m.parse_cap(CAP,'670503',now)[0]['level'],'naranja')
  self.assertEqual(m.parse_cap(CAP,'684504',now),[])
  self.assertEqual(m.parse_cap(CAP,'670503',datetime(2026,11,10,tzinfo=timezone.utc)),[])
 def test_cancel_test_and_bad_dates(self):
  now=datetime(2026,11,7,tzinfo=timezone.utc)
  for original,replacement in [('Update','Cancel'),('Actual','Test')]:self.assertEqual(m.parse_cap(CAP.replace(original,replacement),'670503',now),[])
  with self.assertRaises(ValueError):m.parse_cap(CAP.replace('2026-11-09T00:00:00+01:00','bad'),'670503',now)
 def test_partial_failure_cannot_be_success(self):
  rss='<rss><channel><title>AEMET</title><lastBuildDate>today</lastBuildDate><item><title>'+m.CONFIG['area']+'</title><link>https://www.aemet.es/avisos/cap/a.xml</link></item></channel></rss>'
  with patch.object(m,'download',side_effect=[rss,OSError('offline')]):
   with self.assertRaises(OSError):m.collect()
 def test_empty_complete_and_invalid_feed(self):
  with patch.object(m,'download',return_value='<rss><channel><title>AEMET</title><lastBuildDate>today</lastBuildDate></channel></rss>'):
   self.assertEqual(m.collect()['alerts'],[])
  with patch.object(m,'download',return_value='<html/>'):
   with self.assertRaises(ValueError):m.collect()
if __name__=='__main__':unittest.main()
