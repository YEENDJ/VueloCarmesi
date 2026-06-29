# Spec: Ordenamiento por destacada y landing con datos reales

**Fecha:** 2026-06-29
**Estado:** Aprobado

---

## Problema

El flag `destacada` de las experiencias no impacta el orden de la vista pública `/experiencias` ni la sección de preview en la landing page, que usa datos hardcodeados.

---

## Objetivo

1. En `/experiencias` (pública), las experiencias destacadas aparecen primero.
2. En la landing page, la sección "Nuestras Experiencias" muestra hasta 3 experiencias marcadas como `destacada: true` traídas desde la API.

---

## Cambios

### 1. Backend — `ExperienciasService.findAll()`

**Archivo:** `back/src/experiencias/experiencias.service.ts`

`findAll` recibe un parámetro opcional `soloDestacadas: boolean`:

- Si `soloDestacadas === true`: agrega `where: { destacada: true }`.
- Siempre: `orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }]`.

### 2. Backend — `ExperienciasController.findAll()`

**Archivo:** `back/src/experiencias/experiencias.controller.ts`

El endpoint `GET /experiencias` acepta `?destacadas=true` via `@Query`.
Convierte el string a booleano antes de pasarlo al servicio.

### 3. Frontend — `getExperienciasDestacadas()`

**Archivo:** `front/lib/api/experiencias.ts`

Nueva función helper que llama `GET /experiencias?destacadas=true`.
Fallback: `MOCK_EXPERIENCIAS.filter(e => e.destacada)`.
El slice a 3 lo hace el llamador.

### 4. Landing page — `HomePage`

**Archivo:** `front/app/(public)/(landing)/page.tsx`

- Elimina el array hardcodeado `experienciasPreview`.
- Llama `getExperienciasDestacadas()`, toma `.slice(0, 3)`.
- Si el resultado está vacío, no renderiza la sección de preview.

---

## Comportamiento esperado

| Escenario | Resultado |
|---|---|
| 2 experiencias marcadas como destacadas | Aparecen primeras en `/experiencias` y en la landing |
| Ninguna destacada | `/experiencias` ordena por fecha; landing no muestra preview |
| 5 destacadas | Landing muestra solo las 3 primeras (por `createdAt desc`) |
| API no disponible | Landing usa fallback mock filtrado por `destacada: true` |

---

## Fuera de alcance

- Filtrar `archivada: true` del endpoint público.
- Paginación o reordenamiento manual de destacadas.
