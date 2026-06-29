import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Sembrando datos de Vuelo Carmesí...')

  // Limpiar en orden para respetar FK
  await prisma.itemPedido.deleteMany()
  await prisma.pedido.deleteMany()
  await prisma.reserva.deleteMany()
  await prisma.experiencia.deleteMany()
  await prisma.producto.deleteMany()

  // ─── Experiencias ─────────────────────────────────────────────────────────
  const experiencias = await prisma.experiencia.createMany({
    data: [
      {
        slug: 'ruta-del-cacao',
        nombre: 'Ruta del Cacao',
        descripcion:
          'Recorre el ciclo completo del cacao: desde la mazorca abierta en el árbol hasta la tableta terminada. Fermentación, secado y degustación guiada por los productores de la finca.',
        duracion: '3 horas',
        precio: 95000,
        capacidad: 12,
        destacada: true,
      },
      {
        slug: 'madrugada-cafetera',
        nombre: 'Madrugada Cafetera',
        descripcion:
          'Madrugar nunca fue tan placentero. Acompañá a los recolectores al amanecer, aprendé a seleccionar el grano maduro y cerrá con una taza preparada en V60 con el café que vos mismo cosechaste.',
        duracion: '2.5 horas',
        precio: 75000,
        capacidad: 8,
        destacada: true,
      },
      {
        slug: 'glamping-bajo-las-estrellas',
        nombre: 'Glamping Bajo las Estrellas',
        descripcion:
          'Una noche en carpa domo con colchón real, ropa de cama y vista a la montaña. Incluye cena con ingredientes de la finca, fogón y desayuno campesino al día siguiente.',
        duracion: '1 noche',
        precio: 320000,
        capacidad: 2,
        destacada: true,
      },
      {
        slug: 'taller-chocolate-artesanal',
        nombre: 'Taller de Chocolate Artesanal',
        descripcion:
          'Aprendé a templar, moldear y personalizar tus propias tabletas de chocolate. Te llevás lo que hacés. Ideal para parejas, grupos de amigas y cumpleaños.',
        duracion: '2 horas',
        precio: 85000,
        capacidad: 10,
        destacada: false,
      },
      {
        slug: 'caminata-agroecologica',
        nombre: 'Caminata Agroecológica',
        descripcion:
          'Recorrido por los cultivos de la finca con guía especializado. Conocé cómo funciona un sistema agroforestal, qué es la agricultura regenerativa y por qué el suelo vivo importa.',
        duracion: '1.5 horas',
        precio: 45000,
        capacidad: 15,
        destacada: false,
      },
    ],
  })

  // ─── Productos ────────────────────────────────────────────────────────────
  const productos = await prisma.producto.createMany({
    data: [
      {
        slug: 'chocolate-negro-70',
        nombre: 'Chocolate Negro 70%',
        descripcion: 'Tableta 80 g elaborada con cacao fino de aroma del Huila. Notas a frutos rojos y panela. Sin lecitina ni saborizantes artificiales.',
        precio: 22000,
        stock: 40,
        categoria: 'chocolates',
      },
      {
        slug: 'chocolate-con-panela',
        nombre: 'Chocolate con Panela',
        descripcion: 'Cacao 60% endulzado solo con panela orgánica de trapiche artesanal. Tableta 80 g. El sabor de la abuela, en versión gourmet.',
        precio: 20000,
        stock: 35,
        categoria: 'chocolates',
      },
      {
        slug: 'chocolate-leche-miel',
        nombre: 'Chocolate de Leche y Miel',
        descripcion: 'Cacao 45%, leche entera deshidratada y miel de abejas nativas. Para quienes prefieren algo más suave. Tableta 80 g.',
        precio: 20000,
        stock: 30,
        categoria: 'chocolates',
      },
      {
        slug: 'cacao-polvo-raw',
        nombre: 'Cacao en Polvo Raw',
        descripcion: 'Procesado a baja temperatura para conservar flavonoides y antioxidantes. 200 g. Perfecto para smoothies, repostería y bebidas calientes.',
        precio: 28000,
        stock: 25,
        categoria: 'despensa',
      },
      {
        slug: 'nibs-de-cacao',
        nombre: 'Nibs de Cacao Tostado',
        descripcion: 'Trozos de cacao fermentado y tostado, sin azúcar. 150 g. Crocante y amargo, ideal para topping de yogur, ensaladas o comerlos solos.',
        precio: 18000,
        stock: 20,
        categoria: 'despensa',
      },
      {
        slug: 'mermelada-cacao-maracuya',
        nombre: 'Mermelada Cacao y Maracuyá',
        descripcion: 'Mermelada artesanal hecha en la finca. Frasco 250 g. Combina el amargor del cacao con la acidez tropical del maracuyá. Sin conservantes.',
        precio: 24000,
        stock: 18,
        categoria: 'despensa',
      },
      {
        slug: 'cafe-especial-finca',
        nombre: 'Café Especial de la Finca',
        descripcion: 'Arábica lavado, proceso honey. Tostión media. 250 g molido o en grano (indicar al pedir). Puntuación SCA 84. Cosecha propia.',
        precio: 32000,
        stock: 22,
        categoria: 'cafe',
      },
      {
        slug: 'kit-regalo-carmesi',
        nombre: 'Kit Regalo Vuelo Carmesí',
        descripcion: 'Caja de madera artesanal con: tableta negra 70%, tableta de leche, nibs de cacao, café especial 100 g y tarjeta personalizada. El regalo perfecto.',
        precio: 88000,
        stock: 12,
        categoria: 'regalos',
      },
      {
        slug: 'velas-cacao-soja',
        nombre: 'Vela Aromática de Cacao',
        descripcion: 'Vela de soja con fragancia natural de cacao tostado y vainilla. 180 g, mecha de algodón. Aprox. 40 horas de quemado. Hecha a mano en la finca.',
        precio: 35000,
        stock: 15,
        categoria: 'hogar',
      },
    ],
  })

  await prisma.siteConfig.createMany({
    data: [
      { key: 'hero_image', value: '' },
      { key: 'about_image', value: '' },
      { key: 'gallery_images', value: '[]' },
      { key: 'admin_email', value: '' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ SiteConfig inicializado')

  console.log(`✅ ${experiencias.count} experiencias creadas`)
  console.log(`✅ ${productos.count} productos creados`)
  console.log('🎉 Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
