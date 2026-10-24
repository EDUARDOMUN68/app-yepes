# APP YEPES

Versión 1.0.0. Aplicación independiente de tiempo, noticias y mapa de Yepes, Toledo.

## Funciones

- Previsión ECMWF IFS 9 km mediante Open-Meteo para el punto municipal de Yepes (39.90199, -3.62517).
- Resumen, 14 días, próximas 36 horas, humedad relativa, temperatura, sensación, lluvia, nubosidad, viento, rachas y dirección.
- Mapas Windy de nubes, lluvia y viento; previsiones, no observación por satélite. Lluvia mediante colores, partículas de viento.
- Noticias de yepes.es consultadas cada tres horas. Fecha de consulta diferenciada de publicación. Accesos a redes oficiales enlazadas por el Ayuntamiento: Instagram aytoyepes y Facebook ayuntamientoyepes.
- Intento independiente de lectura de Instagram desde su visor público. Si no devuelve publicaciones no se inventan: se muestra su indisponibilidad y se mantienen las noticias municipales. No se garantiza importación de Instagram ni de publicaciones exclusivas de Facebook.
- Mapa centrado en Yepes, con provincia y municipios de Toledo. Coordenada municipal de Yepes verificada; los demás puntos son centros aproximados de los términos calculados a partir de geometría IGN/es-atlas. No son posiciones oficiales de los cascos urbanos.
- Fondos claros, versión visible, icono propio, instalación Android y actualización al deslizar hacia abajo desde el inicio de El tiempo. Safari permite añadir a pantalla de inicio. La instalación física depende del navegador y no se presume verificada en todos los dispositivos.

## Actualización y límites

La app consulta el tiempo cada hora abierta y al regresar; ECMWF se renueva aproximadamente cada seis horas. No consulta datos con la app cerrada. Mantiene la última previsión con advertencia de antigüedad o error. Los días lejanos son tendencia, no precisión garantizada. Unidades: °C, %, mm, km/h; hora Europe/Madrid.

El actualizador de noticias se ejecuta en GitHub Actions cada tres horas, sujeto a sus tiempos de ejecución. Los datos municipales y sociales se consultan independientemente. El visor de Facebook es opcional y puede pedir sesión. Solo se enlazan titulares y extractos breves a su fuente original; no hay cuentas de usuario ni claves de servicio en la app.

## Arquitectura y publicación

Aplicación estática sin compilación. index.html contiene pantallas; weather.js, news.js y map.js implementan datos y navegación; install.js, refresh.js y sw.js gestionan instalación/actualización. scripts/update-news.mjs y scripts/update-social.mjs son las automatizaciones. news.json y news-social.json conservan datos publicados; social-overrides.json conserva correcciones revisadas.

Publicar por HTTPS con GitHub Pages. La identidad del manifiesto y las cachés son independientes de otras aplicaciones. Los archivos de instrucciones, memorias y pruebas locales no forman parte de la distribución.

Fuentes: Open-Meteo/ECMWF (CC BY 4.0), Ayuntamiento de Yepes, IGN mediante es-atlas, Leaflet, Esri, OpenStreetMap y Windy; créditos visibles. La cartografía externa y las noticias necesitan conexión.

## Historial

- 1.0.0: primera adaptación para Yepes con fuentes, coordenadas, iconos y datos propios.
