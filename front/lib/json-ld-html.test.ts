import { describe, it, expect } from 'vitest'
import { jsonLdHtml } from './json-ld-html'

describe('jsonLdHtml', () => {
  it('no deja pasar un cierre de script', () => {
    const html = jsonLdHtml({ name: 'Cacao</script><script>alert(1)</script>' })
    expect(html).not.toContain('</script')
    expect(html).not.toContain('<')
  })

  it('el resultado sigue siendo el mismo JSON', () => {
    const datos = { name: 'Tableta 70% <negra> & nibs', precio: 25000, lista: ['a\u2028b'] }
    expect(JSON.parse(jsonLdHtml(datos))).toEqual(datos)
  })
})
