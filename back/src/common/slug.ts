/**
 * Convierte un nombre en un slug de URL: sin acentos, en minúsculas y con
 * guiones. Vive en el backend a propósito — el panel ya no deja escribir el
 * slug a mano, y solo aquí se puede garantizar que sea único.
 */
export function toSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Busca el primer slug libre añadiendo un sufijo numérico. Hace falta porque
 * nombres distintos colapsan en el mismo slug: "chocolate ARICAO" y
 * "Chocolate ARICAO " dan los dos `chocolate-aricao`, y la columna es única.
 *
 * `estaOcupado` decide si un candidato ya lo usa OTRO registro, de modo que al
 * editar sin cambiar el nombre el slug se queda como está.
 */
export async function slugUnico(
  base: string,
  estaOcupado: (slug: string) => Promise<boolean>,
): Promise<string> {
  // Un nombre de puros símbolos o emojis se queda sin raíz utilizable.
  const raiz = base || 'sin-nombre'
  let candidato = raiz
  for (let n = 2; await estaOcupado(candidato); n++) {
    candidato = `${raiz}-${n}`
  }
  return candidato
}
