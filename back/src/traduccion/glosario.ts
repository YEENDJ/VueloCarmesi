/**
 * El glosario es la única red de seguridad de la traducción automática.
 *
 * Como el admin nunca ve el inglés antes de publicarlo, lo que salga del motor
 * sale a producción tal cual. Todo lo que no puede salir mal vive acá.
 *
 * DeepL aplica estos pares como sustitución obligatoria: donde aparezca el
 * término de la izquierda, en el inglés aparece el de la derecha, sin
 * interpretación posible.
 */

/**
 * Términos que NO se traducen: nombres propios de la marca y del lugar.
 *
 * Sin esto DeepL «traduce» Vuelo Carmesí como Crimson Flight y la finca pierde
 * su nombre en media web. Se declaran como par idéntico, que es la forma de
 * decirle a un glosario «deja esto en paz».
 */
const NOMBRES_PROPIOS = [
  'Vuelo Carmesí',
  'Finca La Fortuna',
  'Vereda Brisas del Tonoa',
  'Cubarral',
  'Meta',
  'Ariari',
  'Villavicencio',
  'Acacías',
  'Guamal',

  // Marcas y nombres de producto del catálogo. Sin esto DeepL los traduce como
  // si fueran palabras: «Rincón» se vuelve «Corner», «Morena Roja» se vuelve
  // «Red Brunette» y «Sueño salvaje» se vuelve «Wild Dream». Son etiquetas que
  // van impresas en el empaque físico: si la web los llama de otra forma, el
  // cliente no reconoce lo que le llega.
  'ARICAO',
  'CARAO',
  'MUJARI',
  'Rincón',
  'Paradiso',
  'Morena Roja',
  'Sueño salvaje',
  // Aparece en la ficha de los chocolates ARICAO: es la finca donde se cultiva
  // el cacao. Salió al revisar la primera tanda traducida, no estaba previsto.
  'Finca Agroturística El Edén',
  'El Edén',
]

/**
 * Nombres de aves, en nomenclatura ornitológica inglesa.
 *
 * Esto no es cosmético: el público de /aviturismo son birders, y un «blue
 * tanager» en vez de «Blue-gray Tanager» delata que quien escribió la página no
 * es del gremio. Es exactamente el tipo de error que cuesta la reserva.
 *
 * ⚠ Las marcadas con REVISAR tienen varias especies posibles bajo el mismo
 * nombre popular en Colombia. Hay que confirmarlas con el guía de la finca
 * contra la lista del hotspot de eBird antes de darlas por buenas: un nombre
 * de especie equivocado es peor que uno genérico.
 */
const AVES: Array<[string, string]> = [
  ['tángara azul', 'Blue-gray Tanager'],
  ['azulejo', 'Blue-gray Tanager'],
  ['azulejo palmero', 'Palm Tanager'],
  ['tángara urraca', 'Magpie Tanager'],
  ['tigana', 'Sunbittern'],
  ['currucutú', 'Tropical Screech-Owl'],
  ['carriquí', 'Black-chested Jay'],        // REVISAR: «carriquí» cubre varios Cyanocorax
  ['arasarí', 'Aracari'],                   // REVISAR: falta la especie exacta
  ['carpintero', 'Woodpecker'],             // REVISAR: género, no especie
  ['colibrí', 'Hummingbird'],
  ['coqueta', 'Coquette'],                  // REVISAR: especie exacta de colibrí
  ['garza', 'Heron'],
  ['gavilán', 'Hawk'],
  ['loro', 'Parrot'],
  ['tucán', 'Toucan'],
  ['avistamiento de aves', 'birdwatching'],
  ['aviturismo', 'birding'],
]

/**
 * Vocabulario del cacao y del campo.
 *
 * DeepL traduce «mazorca» como «cob» o «ear» —que es la mazorca de maíz— y
 * «beneficio» como «benefit», que en el contexto del cacao no significa nada.
 */
const CACAO: Array<[string, string]> = [
  // «cacao» a secas es el par más importante de toda la lista. Sin él DeepL
  // alterna entre «cacao» y «cocoa» dentro de la misma ficha —medido: «Cocoa
  // Trail» junto a «cacao grove»—, y no son sinónimos para este cliente:
  // *cocoa* es el polvo procesado del supermercado y *cacao* es el grano de
  // origen. Una finca de cacao especial que se anuncia como «cocoa» se está
  // vendiendo como lo contrario de lo que es.
  ['cacao', 'cacao'],
  ['granos de cacao', 'cacao beans'],
  ['árbol de cacao', 'cacao tree'],
  ['degustación de cacao', 'cacao tasting'],
  ['mazorca', 'cacao pod'],
  ['mazorcas', 'cacao pods'],
  ['cacaotal', 'cacao grove'],
  ['cacao en sombrío', 'shade-grown cacao'],
  ['beneficio del cacao', 'cacao post-harvest processing'],
  ['baba de cacao', 'cacao mucilage'],
  ['finca agroecológica', 'agroecological farm'],
  ['chocoterapia', 'cacao spa treatment'],
  ['pasadía', 'day visit'],
  ['vereda', 'rural district'],
  ['piedemonte llanero', 'Llanos foothills'],
  ['sendero', 'trail'],
  ['guía', 'guide'],
]

/**
 * Vocabulario del catálogo real: productos, cata de café y frutas de la zona.
 *
 * Sale de volcar las 22 fichas que ya existen y mirar qué se rompería. No es
 * una lista teórica: cada par de acá corresponde a un texto que hoy está en la
 * base de datos.
 */
const CATALOGO: Array<[string, string]> = [
  // «mucilago» sin tilde también está en la base: la fuente es inconsistente y
  // el glosario tiene que cubrir las dos formas o una de ellas pasa de largo.
  ['mucílago', 'mucilage'],
  ['mucilago', 'mucilage'],
  ['chocolatina', 'chocolate bar'],
  ['grageas', 'chocolate dragées'],
  ['chocolate instantáneo en polvo', 'instant chocolate powder'],
  ['miel de abejas', 'honey'],
  ['destilado de cacao', 'cacao spirit'],
  ['crema de café', 'coffee cream liqueur'],
  ['wiski', 'whisky'],
  ['vino de mucílago de cacao', 'cacao mucilage wine'],

  // Frutas y aromas. «uchuva» no tiene traducción evidente y DeepL la deja tal
  // cual o inventa; en inglés comercial es cape gooseberry o goldenberry.
  ['uchuva', 'cape gooseberry'],
  ['arándano', 'blueberry'],
  ['toronja', 'grapefruit'],
  ['manzanilla', 'chamomile'],
  ['almendra', 'almond'],
  ['piña', 'pineapple'],
  ['frutos rojos', 'red berries'],

  // Cata de café: vocabulario técnico del gremio, no descripción literal.
  ['taza limpia', 'clean cup'],
  ['cuerpo jugoso', 'juicy body'],
  ['residual prolongado', 'long finish'],
  ['notas aromáticas', 'aromatic notes'],

  // Servicios que aparecen en «incluye» de las experiencias.
  ['refrigerio tradicional', 'traditional snack'],
  ['desayuno campesino', 'farm breakfast'],
  ['almuerzo campesino', 'farm lunch'],
  ['póliza de asistencia y riesgos', 'assistance and liability insurance'],
  ['póliza de asistencia médica', 'medical assistance insurance'],
  ['guía especializado', 'specialist guide'],
  ['guía local especializado', 'specialist local guide'],
  ['senderos de conserva', 'conservation trails'],
  ['experiencia cacaotera', 'cacao experience'],

  // Modismo de marca. Literal sería «from the bush to the bar», que en inglés
  // no significa nada; el equivalente del sector es «from tree to bar».
  ['de la mata a la barra', 'from tree to bar'],

  // Las cuatro categorías de la tienda. Son etiquetas de filtro, así que se
  // traducen siempre igual o el mismo filtro aparecería con dos nombres.
  ['chocolates', 'chocolates'],
  ['regalos', 'gifts'],
  ['despensa', 'pantry'],
  ['cafe', 'coffee'],
  ['café', 'coffee'],
]

/** Los pares tal como los quiere la API de DeepL: { término es: término en }. */
export const ENTRADAS_GLOSARIO: Record<string, string> = Object.fromEntries([
  ...NOMBRES_PROPIOS.map(n => [n, n] as [string, string]),
  ...AVES,
  ...CACAO,
  ...CATALOGO,
])

/**
 * Contexto que DeepL lee pero no traduce — y que además no factura.
 *
 * Es gratis y mejora bastante la elección de palabra: sin él, «experiencia» y
 * «reserva» se traducen con el sentido genérico, no con el del sector turístico.
 */
export const CONTEXTO =
  'Texto de una finca agroecológica de cacao en Cubarral, Meta, Colombia, que ' +
  'ofrece experiencias turísticas guiadas, avistamiento de aves y venta de ' +
  'derivados del cacao. El destinatario es un turista extranjero, muchas veces ' +
  'un observador de aves, que evalúa si reservar una visita.'

/**
 * Instrucciones de estilo. DeepL admite hasta 10, de 300 caracteres cada una.
 *
 * Existen porque el registro por defecto sale plano y algo literal: esto es
 * texto que vende, no documentación.
 */
export const INSTRUCCIONES = [
  // Esta primera es la que más trabajo hace, y hubo que medirla.
  //
  // El par «cacao → cacao» del glosario NO basta: DeepL parece tratar una
  // entrada cuyo origen y destino coinciden como no-operación y traduce libre.
  // Medido sobre cinco nombres reales del catálogo, 3 de 5 salían con «cocoa»
  // —«Paradiso Cocoa Spirit», «Cocoa Mucilage Jam»— y con esta regla salen 0.
  // Importa porque *cocoa* es el polvo procesado y *cacao* el grano de origen:
  // una finca de cacao especial anunciada como «cocoa» se vende como lo
  // contrario de lo que es.
  'Traduce siempre "cacao" como "cacao", nunca como "cocoa", en cualquier contexto y aunque forme parte de un nombre de producto.',
  'Mantén un tono cálido y cercano, de marca turística, no de folleto institucional.',
  'Dirígete al lector de tú (you), nunca en tercera persona impersonal.',
  'Conserva los saltos de línea y la separación en párrafos del texto original.',
  'No añadas información que no esté en el original ni expandas las frases.',
]
