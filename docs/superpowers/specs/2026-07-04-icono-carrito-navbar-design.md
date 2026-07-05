# Icono de carrito en el navbar con lucide-react

**Fecha:** 2026-07-04

## Objetivo

Reemplazar el emoji 🛒 del enlace al carrito en el navbar por un icono SVG de una librería de iconos, con el contador de items como badge superpuesto.

## Decisiones

- **Librería:** `lucide-react` (tree-shakeable, estilo de trazo limpio, estándar en Next.js/React).
- **Diseño:** solo icono + badge superpuesto arriba-derecha; se elimina el texto "Carrito".

## Cambios

1. Instalar `lucide-react` como dependencia de `front/`.
2. `front/components/shop/CartBadge.tsx`:
   - Reemplazar `🛒 Carrito` por `<ShoppingCart size={22} />`.
   - Badge dorado con posición absoluta sobre la esquina superior derecha del icono, manteniendo tokens existentes (`--color-gold`, `--color-brown`, `--color-cream`).
   - `aria-label` en el Link ("Carrito de compras", con conteo cuando hay items) para conservar accesibilidad al quitar el texto visible.
   - Sin cambios de lógica: sigue siendo client component con `useCart()`.
3. Sin cambios en `Navbar.tsx` ni en el store del carrito.

## Fuera de alcance

- Migrar otros emojis/iconos del sitio a lucide-react (puede hacerse después).
