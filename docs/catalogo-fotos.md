# Catálogo de fotos

Las fotos de la web y del portafolio salen de **una sola biblioteca**: `front/public/images/`.
Los nombres describen **qué se ve**, no dónde se usa — así una foto sirve para una ruta nueva
sin tener que renombrarla.

```
front/public/images/
  aves/          especies del hotspot
  cacao/         cultivo, mazorca, grano
  experiencias/  el servicio en acción
  personas/      equipo y visitantes
  lugar/         entorno y finca
  marca/         logotipo y QR
```

## Cómo se usa

**Contenido de autor** (landing, rutas nuevas, secciones fijas) → desde la biblioteca,
con `<Image>` de Next para que sirva WebP y `srcset` automáticos:

```tsx
import Image from 'next/image'

<Image src="/images/aves/tigana.jpg" alt="Tigana posada en la orilla"
       width={1600} height={1199} />
```

**Contenido editable** (experiencias, productos, hero) → *no* va aquí. Se sube por el panel
admin, que lo manda a Cloudinary y guarda la URL en la base de datos.

La regla: ¿lo cambiaría la dueña del negocio sin tocar código? → admin. ¿Es parte del
diseño o del texto que escribiste? → biblioteca.

## Originales

`assets/originales/` guarda los archivos de cámara y las variantes de las que salieron
estos derivados. Está en `.gitignore`: no se versiona, no se despliega. Se conserva para
reencuadrar o reimprimir en alta resolución.

`assets/originales/_papelera/` son duplicados exactos y archivos sin uso, apartados
para revisión. Se pueden eliminar una vez verificado que la web y el portafolio están bien.

---

## Aves

| Archivo | Qué es | Notas |
|---|---|---|
| `aves/aracari.jpg` | Aracarí piquimarfil (*Pteroglossus castanotis*) | |
| `aves/azulejo-palmero.jpg` | Azulejo palmero (*Thraupis palmarum*) | |
| `aves/carpintero.jpg` | Carpintero real (*Campephilus melanoleucos*) | |
| `aves/carriqui.jpg` | Carriquí violáceo (*Cyanocorax violaceus*) | |
| `aves/currucutu.jpg` | Currucutú común (*Glaucidium brasilianum*) | |
| `aves/tigana.jpg` | Tigana (*Eurypyga helias*) | |
| `aves/tangara-urraca.jpg` | Tangara urraca (*Cissopis leverianus*) | **© Cristian Enciso.** Recorte vertical: el 14 % superior se cortó a propósito para el cierre del portafolio |
| `aves/tangara-azul.jpg` | Tangara de cabeza azul y pecho amarillo, posada en rama | ⚠️ Especie por confirmar |
| `aves/colibri-posado.jpg` | Colibrí verde con garganta turquesa, posado | ⚠️ Especie por confirmar |
| `aves/colibri-coqueta.jpg` | Colibrí con cresta alimentándose de flor morada | ⚠️ Especie por confirmar |
| `aves/colibri-flor-roja.jpg` | Colibrí en vuelo sobre flor roja | ⚠️ **Marca de agua visible: "Daniel Ramírez".** Verificar autorización antes de publicar |

## Cacao

| Archivo | Qué es |
|---|---|
| `cacao/mazorca-abierta.jpg` | Mazorca abierta mostrando la pulpa blanca |
| `cacao/mazorcas-en-arbol.jpg` | Mazorcas moradas colgando del árbol |
| `cacao/cacaotal.jpg` | Cacaotal con mazorcas en distintos estados de maduración |
| `cacao/cacaotal-mazorcas-rojas.jpg` | Árbol cargado de mazorcas rojas |
| `cacao/flor-de-cacao.jpg` | Detalle de la flor de cacao junto a una mazorca madura |
| `cacao/flor-de-cacao-visitantes.jpg` | Flor de cacao en el tronco, con visitantes al fondo |
| `cacao/mano-cacao.jpg` | Mano sosteniendo una mazorca |
| `cacao/granos-mano.jpg` | Puñado de granos secos sobre el secadero |
| `cacao/bodegon-granos.jpg` | Totumas con granos en distintos puntos de tueste, entre mazorcas |

## Experiencias

| Archivo | Qué es |
|---|---|
| `experiencias/paso-1.jpg` … `paso-5.jpg` | Los cinco pasos de la experiencia cacaotera, en orden |
| `experiencias/chocoterapia.jpg` | Sesión de chocoterapia |
| `experiencias/refrigerio.jpg` | Refrigerio servido a los visitantes |
| `experiencias/avistamiento-binoculares.jpg` | Dos personas observando el dosel con binoculares |
| `experiencias/guia-telescopio.jpg` | Guía con telescopio terrestre en el sendero |
| `experiencias/avistamiento-valla.jpg` | Guía enfocando el telescopio junto a la valla de Vuelo Carmesí |
| `experiencias/portada-experiencias.jpg` | Vertical de portada para la sección de experiencias |

## Personas

| Archivo | Qué es |
|---|---|
| `personas/equipo.jpg` | El equipo de Vuelo Carmesí |
| `personas/equipo-cacao.jpg` | Cuatro integrantes uniformados con mazorcas y granos sobre la mesa |
| `personas/familia.jpg` | Grupo familiar en la experiencia |
| `personas/estudiantes.jpg` | Grupo escolar en recorrido pedagógico |
| `personas/corporativos.jpg` | Grupo corporativo |
| `personas/turistas.jpg` | Turistas en el sendero |
| `personas/grupo-mural.jpg` | Grupo numeroso posando frente al mural del colibrí |

## Lugar

| Archivo | Qué es |
|---|---|
| `lugar/selva.jpg` | Vegetación de la finca, vertical |
| `lugar/historia.jpg` | Imagen de la sección de historia |

## Marca

| Archivo | Qué es | Uso |
|---|---|---|
| `marca/logo-crema.png` | Logotipo horizontal, crema sobre transparente | Navbar y sidebar del admin. Desaparece sobre fondos claros |
| `marca/logo-crimson.png` | Mismo logotipo recoloreado en crimson | Fondos claros; lo usa el portafolio |
| `marca/logo-apilado.png` | Versión apilada en dos líneas con el colibrí | Formatos cuadrados o verticales |
| `marca/qr-whatsapp.png` | QR al WhatsApp de contacto | Portafolio |

---

## Agregar una foto nueva

1. Deja el original en `assets/originales/`.
2. Genera el derivado web en la carpeta temática que corresponda: lado largo máximo
   **1600 px**, JPEG calidad 82 (PNG solo si necesita transparencia).
3. Nómbrala por lo que se ve, en minúsculas y con guiones.
4. Agrégala a la tabla de este archivo — si no está acá, en tres meses nadie sabrá qué es.
