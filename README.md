# APP YEPES

Versión 1.0.1. Aplicación independiente de tiempo, noticias y mapa de Yepes, Toledo.

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

- 1.0.1: iconos según día/noche de Open-Meteo y fase lunar por fecha/hora mediante SunCalc 1.9.0 (BSD-2-Clause, licencia incluida). Luna nocturna despejada/parcialmente nubosa, sin soles en chubascos nocturnos. Fase en el resumen nocturno. Las tarjetas diarias resumen el día completo y no representan una hora nocturna. La fase no indica que la Luna esté sobre el horizonte ni despejada de nubes.

- 1.0.0: primera adaptación para Yepes con fuentes, coordenadas, iconos y datos propios.


### 1.0.2

Luna blanca con contorno gris y zona en sombra gris azulada, dibujada en SVG según la iluminación calculada. Conserva la fase y se distingue del sol amarillo en todos los dispositivos.

### 1.0.3

Tarjetas diarias centradas, icono meteorológico ampliado y humedad en dos líneas ordenadas con valor y porcentaje inseparables.

### 1.0.4

Luna con cráteres suaves, halo plateado y detalle de relieve; tamaño de28px en previsión por horas. Mantiene fase, superficie blanca y sombra diferenciada.

### 1.0.5

Iconos horarios del sol, nubes y precipitación ampliados a26px y alineados con la luna de28px. Texto y tarjetas diarias mantienen su tamaño.

### 1.0.6

Resumen meteorológico principal centrado, con icono y temperatura alineados y métricas distribuidas en columnas adaptables al ancho del móvil.

### 1.1.0: avisos AEMET

Avisos oficiales encima de la previsión, para La Mancha toledana (684504), zona municipal confirmada en AEMET. Índice RSS oficial y mensajes CAP1.2 en español, con nivel, fechas, probabilidad, descripción e instrucciones. Consulta automatizada cada20min mediante GitHub Actions, sujeta a retrasos del servicio. La app consulta al abrir/volver, actualizar y cada5min visible; sin notificaciones push.

Los avisos caducados se ocultan; una consulta fallida conserva el último resultado con estado no confirmado. Tras90min sin éxito no se afirma ausencia de avisos. Solo una consulta completa reemplaza el conjunto anterior, retirando avisos cancelados/actualizados. alerts.json no se guarda en la caché de instalación. Los avisos por zona y la previsión puntual ECMWF son fuentes independientes. Fuentes: https://www.aemet.es/es/rss_info/avisos/esp y ficha municipal oficial.

### 1.1.1

Avisos en una línea breve con enlace a AEMET para los detalles; conserva comprobación de zona, caducidad y estado sin confirmar al fallar o quedar antiguo.
