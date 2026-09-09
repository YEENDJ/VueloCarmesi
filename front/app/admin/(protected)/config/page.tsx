'use client'
import { useState, useEffect } from 'react'
import { getSiteConfigAdmin, patchSiteConfig } from '@/lib/admin/api'
import { revalidateSiteConfig } from '@/app/actions/revalidate'
import HeroImageEditor from '@/components/admin/HeroImageEditor'

/**
 * Las ocho cifras de impacto y su rótulo en el panel.
 *
 * En una lista y no en ocho bloques de JSX repetidos: son el mismo campo ocho
 * veces y así el botón de guardar deriva sus claves de aquí, sin que se pueda
 * añadir una cifra al formulario y olvidar sumarla a la lista que se envía.
 *
 * Las claves son las mismas que leen PruebaSocial e ImpactoSocial.
 */
const CIFRAS_IMPACTO = [
  { key: 'impacto_personas', etiqueta: 'Personas atendidas' },
  { key: 'impacto_instituciones', etiqueta: 'Instituciones educativas' },
  { key: 'impacto_organizaciones', etiqueta: 'Organizaciones' },
  { key: 'impacto_familias', etiqueta: 'Familias cacaoteras' },
  { key: 'impacto_extranjeros', etiqueta: 'Extranjeros' },
  { key: 'impacto_familias_directas', etiqueta: 'Familias beneficiadas · directas' },
  { key: 'impacto_familias_indirectas', etiqueta: 'Familias beneficiadas · indirectas' },
  { key: 'impacto_empleos', etiqueta: 'Empleos por obra' },
] as const

/**
 * Las cifras productivas de la finca, en su propia lista y no sumadas a la de
 * arriba: las de impacto cuentan a quién hemos llegado y estas cuentan qué
 * produce el cultivo. Mezclarlas dejaría «kilos al año» en la misma tarjeta
 * del panel que «personas atendidas», que es justo la confusión que la web
 * evita al separarlas en secciones distintas.
 *
 * Las lee la sección «La Finca» de «Sobre nosotros». Se guardan como número
 * pelado: el separador de miles lo pone el front.
 */
const CIFRAS_FINCA = [
  { key: 'finca_plantas', etiqueta: 'Plantas de cacao' },
  { key: 'finca_variedades', etiqueta: 'Variedades' },
  { key: 'finca_produccion_kg', etiqueta: 'Kilos de grano seco al año' },
] as const

export default function ConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getSiteConfigAdmin().then(data => { setConfig(data); setLoading(false) })
  }, [])

  function set(key: string, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  async function guardar(keys: string[]) {
    setSaving(keys[0])
    try {
      const data = Object.fromEntries(keys.map(k => [k, config[k] ?? '']))
      await patchSiteConfig(data)
      await revalidateSiteConfig()
      setToast('Guardado correctamente')
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Error al guardar')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, padding: 32 }}>Cargando…</p>

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Configuración</div>
          <div className="admin-page-subtitle">Imágenes y ajustes generales del sitio</div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#1a1a1a',
          color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14, zIndex: 1000,
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Sección: Hero */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--color-brown)' }}>
            Imagen principal (Hero)
          </div>
          <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 24 }}>
            Sube la foto y ajusta el recorte antes de guardar
          </div>
          <HeroImageEditor
            value={config.hero_image ?? ''}
            onChange={url => set('hero_image', url)}
            onSave={async url => {
              await patchSiteConfig({ hero_image: url })
              await revalidateSiteConfig()
              setToast('Guardado correctamente')
              setTimeout(() => setToast(''), 3000)
            }}
          />
        </div>

        {/* Sección: Sobre Nosotros */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--color-brown)' }}>
            Foto Sobre Nosotros
          </div>
          <HeroImageEditor
            value={config.about_image ?? ''}
            onChange={url => set('about_image', url)}
            onSave={async url => {
              await patchSiteConfig({ about_image: url })
              await revalidateSiteConfig()
              setToast('Guardado correctamente')
              setTimeout(() => setToast(''), 3000)
            }}
            defaultAspect={4 / 3}
            previewAspect="4 / 3"
          />
        </div>

        {/* Sección: Experiencias — lo que es igual en todas se escribe acá */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--color-brown)' }}>
            Datos comunes de las experiencias
          </div>
          <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 24, maxWidth: '60ch' }}>
            Se escriben una vez y aparecen en todas las fichas. Solo hay que
            repetirlos en el formulario de una experiencia cuando esa en concreto
            sea la excepción.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div className="admin-field-label">Punto de encuentro por defecto</div>
              <textarea
                className="admin-input"
                rows={2}
                value={config.punto_encuentro ?? ''}
                onChange={e => set('punto_encuentro', e.target.value)}
                placeholder="Finca La Fortuna, Vereda Brisas del Tonoa, Cubarral, Meta"
                style={{ resize: 'vertical' }}
              />
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Dónde llega el visitante. Es la duda número uno antes de reservar.
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="admin-field-label">Resumen de cancelación</div>
              <input
                className="admin-input"
                value={config.resumen_cancelacion ?? ''}
                onChange={e => set('resumen_cancelacion', e.target.value)}
                placeholder="Reembolso del 100 % cancelando dentro de las 24 horas siguientes a reservar y con más de 15 días de anticipación."
              />
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Una línea junto al botón de reservar, con enlace a la política completa.
                Tiene que decir lo mismo que la política: es lo que el visitante lee
                antes de pagar, y con eso reclama después.
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="admin-field-label">WhatsApp de contacto</div>
              <input
                className="admin-input"
                type="tel"
                value={config.whatsapp ?? ''}
                onChange={e => set('whatsapp', e.target.value)}
                placeholder="+57 320 123 4567"
                style={{ maxWidth: 360 }}
              />
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Aparece bajo el precio de cada ficha, con el mensaje ya escrito y el
                nombre de la experiencia. Quien no reserva casi siempre es porque le
                falta un dato: esta es su salida. Déjalo vacío y la línea no sale.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary"
              onClick={() => guardar(['punto_encuentro', 'resumen_cancelacion', 'whatsapp'])}
              disabled={saving === 'punto_encuentro'}
              style={{ minHeight: 44 }}
            >
              {saving === 'punto_encuentro' ? 'Guardando…' : 'Guardar datos comunes'}
            </button>
          </div>
        </div>

        {/* Sección: Cifras de impacto — los números que la web presume */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--color-brown)' }}>
            Cifras de impacto
          </div>
          <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 24, maxWidth: '60ch' }}>
            Los números de «Cientos de personas ya confiaron en nosotros», en la
            portada, y los de impacto social en «Sobre nosotros». Antes estaban
            escritos en el código y actualizarlos exigía un despliegue.
          </div>
          {/* min(180px, 100%): el panel se abre desde el móvil el día que hay
              una urgencia, y una columna de 180px fija desborda a 320px. */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
            gap: 16,
          }}>
            {CIFRAS_IMPACTO.map(({ key, etiqueta }) => (
              <div key={key} style={{ minWidth: 0 }}>
                <div className="admin-field-label">{etiqueta}</div>
                <input
                  className="admin-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={config[key] ?? ''}
                  onChange={e => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary"
              onClick={() => guardar(CIFRAS_IMPACTO.map(c => c.key))}
              disabled={saving === CIFRAS_IMPACTO[0].key}
              style={{ minHeight: 44 }}
            >
              {saving === CIFRAS_IMPACTO[0].key ? 'Guardando…' : 'Guardar cifras'}
            </button>
          </div>
        </div>

        {/* Sección: Cifras de la finca — lo que produce el cultivo */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--color-brown)' }}>
            Cifras de la finca
          </div>
          <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 24, maxWidth: '60ch' }}>
            Los datos productivos de «La Finca», en «Sobre nosotros». Escríbelos
            como número pelado —1300, no 1.300—: el punto de los miles lo pone
            la web al pintarlos. Cambian cada temporada, así que actualizarlos
            desde aquí evita un despliegue por cosecha.
          </div>
          {/* Misma rejilla que las cifras de impacto: min(180px, 100%) para que
              la columna ceda en vez de desbordar cuando el panel se abre en un
              teléfono. */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
            gap: 16,
          }}>
            {CIFRAS_FINCA.map(({ key, etiqueta }) => (
              <div key={key} style={{ minWidth: 0 }}>
                <div className="admin-field-label">{etiqueta}</div>
                <input
                  className="admin-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={config[key] ?? ''}
                  onChange={e => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary"
              onClick={() => guardar(CIFRAS_FINCA.map(c => c.key))}
              disabled={saving === CIFRAS_FINCA[0].key}
              style={{ minHeight: 44 }}
            >
              {saving === CIFRAS_FINCA[0].key ? 'Guardando…' : 'Guardar cifras de la finca'}
            </button>
          </div>
        </div>

        {/* Sección: Notificaciones */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--color-brown)' }}>
            Notificaciones
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="admin-field-label">Email del administrador</div>
              <input
                className="admin-input"
                type="email"
                value={config.admin_email ?? ''}
                onChange={e => set('admin_email', e.target.value)}
                placeholder="admin@vuelocarmesi.com"
                style={{ maxWidth: 360 }}
              />
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Recibe alertas de nuevas reservas, pedidos y mensajes de contacto
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary"
              onClick={() => guardar(['admin_email'])}
              disabled={saving === 'admin_email'}
            >
              {saving === 'admin_email' ? 'Guardando…' : 'Guardar notificaciones'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
