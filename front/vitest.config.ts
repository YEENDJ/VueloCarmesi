import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        // Sin esto, `next-intl` se carga tal cual desde node_modules y lo
        // resuelve Node, que no aplica los alias de abajo. Procesándolo con
        // Vite, su `import 'next/navigation'` pasa por el alias y encuentra el
        // archivo.
        inline: ['next-intl'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `next-intl` importa 'next/navigation' sin extensión, y Next no declara
      // ese subcamino en sus `exports`: bajo Next lo resuelve el bundler, pero
      // Vite en modo ESM busca un archivo literal y no lo encuentra. Sin este
      // alias, cualquier test que toque lib/i18n/navigation.ts ni siquiera
      // llega a ejecutarse — falla al importar.
      'next/navigation': 'next/navigation.js',
    },
  },
})
