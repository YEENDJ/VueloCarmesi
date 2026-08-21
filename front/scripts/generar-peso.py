"""Genera public/fonts/Peso-Bellota.woff2 — el signo de peso de la ficha.

Playfair Display dibuja el $ con dos barras verticales atravesando la S. Es una
convención didone legítima, pero a los tamaños de la tarjeta de precio deja de
leerse como un precio. Bellota lo dibuja con una sola barra, así que el $ —y
solo el $— sale de Bellota, enganchado con `unicode-range: U+0024` en
styles/tokens.css.

Este script recorta Bellota Bold a ese único glifo (2,3 KB en vez de 70 KB) y le
hornea el escalado al 92% en el propio contorno. El 92% sale de medir: el $ de
Bellota mide 837 unidades de em y el de Playfair 972, pero Bellota tiene el ojo
bastante más grande y sin ajuste el símbolo sobresale por encima de las cifras.

El escalado va en el contorno y no en el descriptor `size-adjust` porque ese
descriptor no existe en Safari 16 y anteriores: allí se ignora en silencio y el
símbolo sale más grande de la cuenta.

Solo hay que volver a correrlo si cambia Bellota-Bold.ttf o si se decide otra
escala. Necesita `fonttools` y `brotli`:

    pip install fonttools brotli
    python front/scripts/generar-peso.py
"""

from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ESCALA = 0.92
FUENTES = Path(__file__).resolve().parent.parent / "public" / "fonts"
ORIGEN = FUENTES / "Bellota-Bold.ttf"
DESTINO = FUENTES / "Peso-Bellota.woff2"
PESO = 0x24  # $


def main() -> None:
    fuente = TTFont(ORIGEN)

    opciones = Options()
    opciones.layout_features = []
    opciones.name_IDs = [1, 2, 3, 4, 6]
    opciones.notdef_outline = False
    opciones.drop_tables += ["GSUB", "GPOS", "kern", "DSIG"]

    recorte = Subsetter(options=opciones)
    recorte.populate(unicodes={PESO})
    recorte.subset(fuente)

    # El contorno y el avance se escalan juntos: si solo se escalara el dibujo,
    # el símbolo quedaría con el hueco de un glifo de tamaño completo al lado.
    glifos = fuente.getGlyphSet()
    lapiz = TTGlyphPen(glifos)
    glifos["dollar"].draw(TransformPen(lapiz, Transform().scale(ESCALA)))
    fuente["glyf"]["dollar"] = lapiz.glyph()
    avance, lsb = fuente["hmtx"]["dollar"]
    fuente["hmtx"]["dollar"] = (round(avance * ESCALA), round(lsb * ESCALA))

    fuente.flavor = "woff2"
    fuente.save(DESTINO)
    print(f"{DESTINO.name}: {DESTINO.stat().st_size} bytes")


if __name__ == "__main__":
    main()
