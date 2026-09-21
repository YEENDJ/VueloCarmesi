/**
 * Quiénes ya visitaron la finca, por nombre.
 *
 * Fuente: hoja 22 del portafolio 2026 (`portafolio/src/portafolio.html`), que
 * es la lista comercial aprobada. Vive acá y no dentro de un componente porque
 * la usan dos sitios —la sección de prueba social de la home y la página de
 * grupos— y hasta ahora no coincidían: `PruebaSocial` tenía nueve nombres
 * mezclando los dos grupos y le faltaban seis de los del portafolio. Que la
 * misma prueba social diga dos cosas distintas en dos páginas es exactamente lo
 * que nota un comprador institucional, que es el público al que le importa.
 *
 * **Nombres en texto, nunca logotipos.** Listar clientes por nombre es práctica
 * comercial normal; reproducir sus marcas exige autorización escrita de cada
 * una, y varias de estas tienen manual de uso de marca.
 *
 * No se traducen: son nombres propios.
 */

export const INSTITUCIONES_EDUCATIVAS = [
  'Uniandes',
  'Unillanos',
  'SENA',
  'Unimeta',
  'Unicooperativa',
  'Uniminuto',
  'Colegio Dorado',
  'Colegio Cubarral',
] as const

export const ORGANIZACIONES = [
  'Socodevi',
  'Fedecacao',
  'Rare',
  'Asmeta',
  'Limpal Colombia',
  'Más Meta',
  'Ecopetrol',
] as const

/**
 * Las dos listas juntas, para donde se muestran sin separar por tipo.
 *
 * La home las pinta así: en una tira de píldoras bajo las cifras de impacto, el
 * corte entre «educativas» y «gremios» no aporta nada y obligaría a dos filas
 * de rótulos. En /grupos sí van separadas, porque ahí el visitante busca
 * específicamente a los de su propio sector.
 */
export const TODOS_LOS_CLIENTES = [
  ...INSTITUCIONES_EDUCATIVAS,
  ...ORGANIZACIONES,
] as const
