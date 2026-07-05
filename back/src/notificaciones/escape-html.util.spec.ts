import { escapeHtml } from './escape-html.util'

describe('escapeHtml', () => {
  it('escapa caracteres especiales de HTML', () => {
    expect(escapeHtml(`<b>Café "Premium" & 'Miel'</b>`))
      .toBe('&lt;b&gt;Café &quot;Premium&quot; &amp; &#39;Miel&#39;&lt;/b&gt;')
  })

  it('deja intacto un texto sin caracteres especiales', () => {
    expect(escapeHtml('Café Premium 500g')).toBe('Café Premium 500g')
  })
})
