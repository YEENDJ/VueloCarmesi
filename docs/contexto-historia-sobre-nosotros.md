# Contexto para continuar: Historia de la finca en /sobre-nosotros

## Objetivo del plan
Reemplazar la sección "El origen" de la página pública `/sobre-nosotros` por una **línea de tiempo (timeline) animada con framer-motion** que recorra la historia real de la finca Vuelo Carmesí.

## Requisitos del usuario (IMPORTANTE — respetar al pie de la letra)
1. **No suprimir NINGÚN fragmento del texto de la historia.** Todo el texto que entregó el usuario debe estar presente, completo.
2. Dividir el texto **por bloques** (cada bloque = un momento/etapa de la historia).
3. Las imágenes/fotos son **opcionales**: se agregan SOLO donde aportan sentido al bloque. NO todos los bloques necesitan foto. NO debe verse como un collage de imágenes.
4. El diseño es una **línea de tiempo vertical** con framer-motion (animación de aparición en scroll).
5. Las secciones POR DEBAJO de la historia ("Misión y Valores", "La Finca", "El Proceso", "El Equipo", "Galería") deben **permanecer intactas, como mock actual** (no se tocan en esta tarea).

## Estado actual de los archivos
- `front/app/(public)/(landing)/sobre-nosotros/page.tsx`
  - Tiene `export default async function SobreNosotrosPage()` con `getSiteConfig()` y `const aboutImage = config.about_image`.
  - La sección "Origen" actual va de la línea ~193 a ~423 y es un **muro de texto plano** (párrafos largos dentro de un contenedor de 800px con la imagen `aboutImage` en formato ancho arriba). **El usuario rechazó esta versión.**
  - La sección **NO usa todavía el componente `HistoriaTimeline`** (aún no se cableó).
- `front/components/secciones/HistoriaTimeline.tsx` — **YA CREADO** (componente `'use client'` con framer-motion). PERO:
  - Actualmente **agrupa varios párrafos del texto original juntos** y **asigna imagen a todos los bloques** (no respeta el requisito 1 y 3). Hay que reescribir su arreglo de datos según los requisitos.
  - Usa imágenes reales de `front/public/images/...` vía `backgroundImage` en un `div` (con degradado y etiqueta encima).
- `front/app/globals.css` — el CSS de la línea de tiempo **YA SE AGREGÓ** al final del archivo (clases `.historia-*`: `.historia-timeline`, `.historia-linea`, `.historia-item`, `.historia-nodo`, `.historia-bloque`, `.historia-carta`, `.historia-cabecera`, `.historia-anyo`, `.historia-etiqueta`, `.historia-media`, más la consulta `@media (max-width: 900px)`). Los estilos ya contemplan alternancia de bloques y versión móvil con línea a la izquierda.
- **framer-motion YA INSTALADO** en `front/` (agregado a package.json).

## Texto oficial de la historia (dividir en bloques; este es el texto COMPLETO que no se debe suprimir)
Voy a marcarlo en párrafos identificables. Cada párrafo es un candidato a bloque, o se pueden agrupar de forma coherente:

- P1: "Nuestra historia comenzó mucho antes de que llegaran los primeros visitantes. Comenzó con el cacao."
- P2: "Desde hace cerca de 40 años, en estas tierras se cultiva cacao. Durante buena parte de ese tiempo eran cultivos tradicionales, con árboles híbridos, poco tecnificados y mezclados con café. Era una forma de producción aprendida con el tiempo, basada principalmente en el conocimiento y la experiencia de la familia."
- P3: "En 2006, comenzó una nueva etapa. Decidimos transformar la manera de producir: se eliminó el café que compartía espacio con el cacao y se inició un proceso de tecnificación del cultivo, incorporando variedades de cacao con mejores características productivas."
- P4: "Fueron años de aprendizaje, de trabajo y de entender cada vez mejor el cultivo. Pero la finca no solo nos enseñaba sobre cacao. También nos mostraba todo aquello que hacía especial la vida rural: los animales, los paisajes, los sonidos de la naturaleza, las labores del campo y las historias que forman parte de nuestra tradición campesina."
- P5: "Y entonces llegó 2020."
- P6: "La pandemia nos obligó a detenernos y mirar nuestro entorno de una manera diferente. Nos hizo pensar que todo aquello que durante años habíamos considerado parte de nuestra vida cotidiana podía convertirse también en una experiencia para compartir con otras personas."
- P7: "Cristian, uno de los fundadores, ya tenía experiencia en turismo desde 2012, principalmente en el turismo de aventura. Después de la pandemia, esa experiencia encontró un nuevo camino: llevar el turismo a la finca y convertir el campo, el cacao y la naturaleza en una experiencia cercana, auténtica y familiar."
- P8: "Así nació la idea de crear un proyecto turístico que permitiera mostrar las bondades del campo, acercar a los visitantes a la tradición campesina y contar la historia del cacao desde su cultivo hasta su transformación artesanal."
- P9: "En 2021 abrimos las puertas de Vuelo Carmesí. Lo que comenzó como una finca familiar productora de cacao empezó a convertirse también en un espacio para recibir, enseñar, compartir y conectar."
- P10: "Desde entonces, hemos ido construyendo una propuesta que une cacao, agroecología, naturaleza, cultura campesina y turismo, sin dejar de lado aquello que nos dio origen: la tierra y el trabajo de nuestra familia."
- P11: "Vuelo Carmesí no nació de la idea de crear una experiencia turística. Nació de una historia que ya existía y que decidimos abrirle las puertas al mundo. Hoy queremos que cada persona que nos visita pueda conocer esa historia, caminarla, sentirla y llevarse consigo un pedacito de la vida del campo."

Nota: el texto original del usuario coloca "Cristian... 2012... turismo de aventura" y "Después de la pandemia..." como párrafos separados dentro del mismo tramo de la historia. Puedes agruparlos como un único bloque (P7) o separarlos, pero el contenido debe estar completo.

## Imágenes disponibles (front/public/images/)
- `aves/`: aracari, azulejo-palmero, carpintero, carriqui, colibri-coqueta, colibri-flor-roja, colibri-posado, currucutu, tangara-azul, tangara-urraca, tigana (fotos de aves)
- `cacao/`: bodegon-granos, cacaotal, cacaotal-mazorcas-rojas, flor-de-cacao, flor-de-cacao-visitantes, granos-mano, mano-cacao, mazorca-abierta, mazorcas-en-arbol
- `lugar/`: historia, selva
- `personas/`: corporativos, equipo, equipo-cacao, estudiantes, familia, grupo-mural, turistas
- `marca/`: (no listado arriba, revisar si se necesita)

## Sugerencia de mapeo (imagen solo donde aporte; la decisión final queda abierta)
- P1+P2 (el origen, ~40 años): `cacao/cacaotal.jpg` — sentido: el cacao como inicio.
- P3 (2006 tecnificación): `cacao/cacaotal-mazorcas-rojas.jpg` — sentido: el cambio del cultivo.
- P4 (vida rural / aves / paisajes): `aves/tangara-azul.jpg` o `lugar/selva.jpg` — sentido: naturaleza y vida rural.
- P5+P6 (2020 pandemia): puede IR SIN FOTO (es una pausa; ilustrarlo con ícono/estilo solo).
- P7 (Cristian / turismo): `personas/equipo.jpg` o `personas/equipo-cacao.jpg`.
- P8 (nace el proyecto): puede ir sin foto o con `personas/familia.jpg`.
- P9 (2021 abrimos puertas): `personas/grupo-mural.jpg` o `lugar/historia.jpg`.
- P10+P11 (hoy / cierre): puede cerrar SIN foto (frase emblemática de cierre).

## Tareas pendientes
1. Reescribir el arreglo `HISTORIA` en `HistoriaTimeline.tsx` para que contenga TODO el texto por bloques, con `imagen` vacía (`''`) donde no corresponda foto. El componente `BloqueImagen` debe mostrar un placeholder ilustrado (no foto) cuando `imagen` esté vacío.
2. Cablesar el componente: en `sobre-nosotros/page.tsx`, importar `HistoriaTimeline` y reemplazar el contenido de la sección "Origen" (líneas 193–423) por la nueva sección con encabezado centrado + `<HistoriaTimeline />`. (Hay un borrador listo en `C:\Users\YEEND\AppData\Local\Temp\opencode\origen-replace.txt` que ya se puede adaptar.)
3. Revisar el CSS ya agregado en `globals.css` (clases `.historia-*`) por si hace falta que `historia-media` soporte el estado "sin imagen" (placeholder ilustrado) además del "con imagen".
4. Verificar: `npx tsc --noEmit` y `npx eslint` sobre el/dolor puesto en orden (los errores ya existentes de la página: `ImgDark` sin usar y un `<a>` hacia `/experiencias/` en la línea 764 — NO son de esta tarea, no arreglarlos salvo que estorben).

## Notas técnicas
- La página usa variables CSS: `--color-crimson`, `--color-orange`, `--color-brown`, `--color-cream`, `--color-gold`, `--color-amber`, y fuentes `--font-display`, `--font-body`.
- framer-motion: importar como `import { motion } from 'framer-motion'`. El componente debe tener `'use client'`.
- La animación de la línea que "crece" también se puede lograr con `motion` en vez de CSS `animation-timeline: view()` (que no todos los navegadores soportan). Considerar hacer el `whileInView` del nodo/crecimiento con framer-motion.
- Respeta la moneda `$` y el idioma español de Colombia (tuteo) en cualquier texto nuevo.
- NO crear archivos de documentación ni README. Solo código.
