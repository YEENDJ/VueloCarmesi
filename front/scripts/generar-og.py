"""
Genera la imagen para compartir de la portada (Open Graph), una por idioma:
public/images/og/portada-es.jpg y portada-en.jpg, de 1200x630.

    python front/scripts/generar-og.py

Es un archivo estático y no una ruta `opengraph-image` de Next: así no cuesta
nada al servirla, no pasa por la caché ni por el optimizador, y lo que se
comparte es exactamente lo que se revisó a ojo.

El lema sale de `portada.heroTitulo` en messages/{es,en}.json: si cambia allí,
hay que volver a correr este script. **Al regenerar, cambia el nombre de los
archivos** (p. ej. portada-es-2.jpg) y actualiza la ruta en la página:
WhatsApp y Facebook guardan la vista previa por URL y no la vuelven a pedir.

Se dibuja al doble de tamaño y se reduce al final para que los bordes del
círculo y del texto salgan suaves.
"""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FRONT = Path(__file__).resolve().parent.parent
PUBLIC = FRONT / 'public'
SALIDA = PUBLIC / 'images' / 'og'

ESCALA = 2
ANCHO, ALTO = 1200 * ESCALA, 630 * ESCALA

# Los mismos de styles/tokens.css.
CRIMSON = (213, 19, 18)
CRIMSON_OSCURO = (150, 14, 13)
CREMA = (255, 234, 202)
AMBAR = (245, 156, 0)

# Ancho de la franja carmesí. La foto empieza un poco antes y la franja la
# tapa con un borde curvo.
FRANJA = 600 * ESCALA


def px(n: float) -> int:
    return round(n * ESCALA)


def cubrir(img: Image.Image, ancho: int, alto: int, foco=(0.5, 0.5)) -> Image.Image:
    """Escala y recorta como `object-fit: cover`, con el punto `foco` a la vista."""
    escala = max(ancho / img.width, alto / img.height)
    nueva = img.resize((round(img.width * escala), round(img.height * escala)), Image.LANCZOS)
    x = round((nueva.width - ancho) * foco[0])
    y = round((nueva.height - alto) * foco[1])
    return nueva.crop((x, y, x + ancho, y + alto))


def fuente(nombre: str, tam: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(PUBLIC / 'fonts' / nombre), px(tam))


def generar(idioma: str) -> Path:
    catalogo = json.loads((FRONT / 'messages' / f'{idioma}.json').read_text(encoding='utf-8'))
    lema = catalogo['portada']['heroTitulo'].split('\n')

    lienzo = Image.new('RGB', (ANCHO, ALTO), CRIMSON)

    # Foto de fondo a la derecha: el cacaotal, con las mazorcas a la vista.
    cacaotal = Image.open(PUBLIC / 'images' / 'cacao' / 'cacaotal-bosque.jpg').convert('RGB')
    foto = cubrir(cacaotal, ANCHO - FRANJA + px(80), ALTO, foco=(0.55, 0.5))
    lienzo.paste(foto, (FRANJA - px(80), 0))

    # Franja carmesí con el borde derecho curvo y un degradado leve hacia abajo.
    franja = Image.new('L', (ANCHO, ALTO), 0)
    d = ImageDraw.Draw(franja)
    d.rectangle((0, 0, FRANJA - px(60), ALTO), fill=255)
    d.ellipse((FRANJA - px(260), -px(220), FRANJA + px(60), ALTO + px(220)), fill=255)
    degradado = Image.new('RGB', (1, ALTO))
    for y in range(ALTO):
        t = y / ALTO
        degradado.putpixel((0, y), tuple(round(a + (b - a) * t * 0.55) for a, b in zip(CRIMSON, CRIMSON_OSCURO)))
    lienzo.paste(degradado.resize((ANCHO, ALTO)), (0, 0), franja)

    # El colibrí en un círculo sobre la unión de la franja y la foto. El foco
    # deja fuera la firma del fotógrafo, que va abajo a la derecha.
    colibri = Image.open(PUBLIC / 'images' / 'aves' / 'colibri-flor-roja.jpg').convert('RGB')
    diam = px(250)
    # Recorte cuadrado alrededor del ave, en proporción de la foto (centro y lado).
    # El lado cubre al ave entera —ala, cola y la flor— dentro del círculo, que
    # recorta las esquinas del cuadrado; abajo queda fuera la firma.
    lado = round(colibri.height * 0.80)
    x0 = round(colibri.width * 0.47 - lado / 2)
    y0 = round(colibri.height * 0.50 - lado / 2)
    circulo = colibri.crop((x0, y0, x0 + lado, y0 + lado)).resize((diam, diam), Image.LANCZOS)
    mascara = Image.new('L', (diam, diam), 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, diam, diam), fill=255)
    cx, cy = FRANJA + px(75), px(440)
    sombra = Image.new('L', (ANCHO, ALTO), 0)
    ImageDraw.Draw(sombra).ellipse((cx - diam // 2 + px(6), cy - diam // 2 + px(10), cx + diam // 2 + px(6), cy + diam // 2 + px(10)), fill=110)
    sombra = sombra.filter(ImageFilter.GaussianBlur(px(14)))
    lienzo.paste((60, 8, 6), (0, 0), sombra)
    borde = px(8)
    ImageDraw.Draw(lienzo).ellipse((cx - diam // 2 - borde, cy - diam // 2 - borde, cx + diam // 2 + borde, cy + diam // 2 + borde), fill=CREMA)
    lienzo.paste(circulo, (cx - diam // 2, cy - diam // 2), mascara)

    # Logo con el colibrí, en crema.
    logo = Image.open(PUBLIC / 'images' / 'marca' / 'logo-apilado.png').convert('RGBA')
    logo = logo.crop(logo.getbbox())
    ancho_logo = px(330)
    logo = logo.resize((ancho_logo, round(logo.height * ancho_logo / logo.width)), Image.LANCZOS)
    margen = px(64)
    lienzo.paste(logo, (margen, px(58)), logo)

    # Lema de la portada.
    d = ImageDraw.Draw(lienzo)
    letra = fuente('Bellota-Bold.ttf', 34)
    y = px(58) + logo.height + px(40)
    for linea in lema:
        d.text((margen, y), linea, font=letra, fill=CREMA)
        y += px(44)

    # Pie: un filete ámbar, la ubicación y el dominio.
    y_pie = ALTO - px(78)
    d.rectangle((margen, y_pie - px(22), margen + px(56), y_pie - px(18)), fill=AMBAR)
    d.text((margen, y_pie), 'Cubarral, Meta · Colombia', font=fuente('Bellota-Bold.ttf', 22), fill=CREMA)
    d.text((margen, y_pie + px(30)), 'vuelocarmesi.com', font=fuente('Bellota-Regular.ttf', 20), fill=AMBAR)

    final = lienzo.resize((1200, 630), Image.LANCZOS)
    SALIDA.mkdir(parents=True, exist_ok=True)
    destino = SALIDA / f'portada-{idioma}.jpg'
    final.save(destino, quality=90, subsampling=0, optimize=True, progressive=True)
    return destino


if __name__ == '__main__':
    for idioma in ('es', 'en'):
        ruta = generar(idioma)
        print(ruta.relative_to(FRONT), f'{ruta.stat().st_size // 1024} KB')
