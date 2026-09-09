"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconoWhatsapp from "@/components/ui/IconoWhatsapp";
import {
  IconoInstagram,
  IconoFacebook,
  IconoTiktok,
} from "@/components/ui/IconosRedes";
import { CONTACTO, MENSAJE_WHATSAPP, REDES, whatsappCon } from "@/lib/contacto";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// El logotipo de cada red junto al nombre: es lo que hace que se reconozcan de
// un vistazo, sin leer. Pintan con currentColor, así que siguen al crimson de la
// píldora y se vuelven crema solos cuando el hover la rellena.
const RED_LINKS = [
  {
    label: "Instagram",
    href: REDES.instagram,
    icono: <IconoInstagram size={18} />,
  },
  {
    label: "Facebook",
    href: REDES.facebook,
    icono: <IconoFacebook size={18} />,
  },
  { label: "TikTok", href: REDES.tiktok, icono: <IconoTiktok size={18} /> },
];

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [estado, setEstado] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("loading");
    try {
      const res = await fetch(`${API}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  };

  return (
    <section className="page-shell contacto-shell">
      <div className="contacto-grid">
        <div className="contacto-formulario">
          <h2 className="contacto-subtitulo">Escríbenos un mensaje</h2>
          {estado === "ok" ? (
            <p style={{ color: "var(--color-crimson)", fontSize: "1.1rem" }}>
              ¡Gracias! Te respondemos lo antes posible. Revisa tu correo.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <Input
                label="Nombre"
                name="nombre"
                required
                value={form.nombre}
                onChange={handleChange}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
              />
              <Input
                label="Mensaje"
                name="mensaje"
                required
                value={form.mensaje}
                onChange={handleChange}
                multiline
              />
              {estado === "error" && (
                <p
                  style={{
                    color: "var(--color-crimson)",
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  Hubo un error al enviar. Inténtalo de nuevo o escríbenos
                  directamente a {CONTACTO.email}.
                </p>
              )}
              <Button type="submit" disabled={estado === "loading"}>
                {estado === "loading" ? "Enviando…" : "Enviar mensaje"}
              </Button>
            </form>
          )}
        </div>

        <aside
          className="contacto-canales"
          aria-label="Otras formas de contacto"
        >
          <h2 className="contacto-subtitulo">Otras formas de contactarnos</h2>

          <a
            href={whatsappCon(MENSAJE_WHATSAPP.contacto)}
            target="_blank"
            rel="noopener noreferrer"
            className="contacto-canal contacto-canal-destacado"
          >
            <span className="contacto-canal-icono" aria-hidden="true">
              <IconoWhatsapp />
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">WhatsApp</span>
              <span className="contacto-canal-dato">{CONTACTO.telefono}</span>
              <span className="contacto-canal-nota">
                Lo más rápido para reservar
              </span>
            </span>
          </a>

          <a href={`tel:${CONTACTO.telefonoE164}`} className="contacto-canal">
            <span className="contacto-canal-icono" aria-hidden="true">
              📞
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">Llámanos</span>
              <span className="contacto-canal-dato">{CONTACTO.telefono}</span>
            </span>
          </a>

          <a href={`mailto:${CONTACTO.email}`} className="contacto-canal">
            <span className="contacto-canal-icono" aria-hidden="true">
              ✉️
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">Correo</span>
              <span className="contacto-canal-dato">{CONTACTO.email}</span>
            </span>
          </a>

          <div className="contacto-canal contacto-canal-estatico">
            <span className="contacto-canal-icono" aria-hidden="true">
              📍
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">Dónde estamos</span>
              <span className="contacto-canal-dato">{CONTACTO.direccion}</span>
              <span className="contacto-canal-nota">{CONTACTO.municipio}</span>
            </span>
          </div>
        </aside>
        
      </div>
      <div className="contacto-redes-lista">
          {RED_LINKS.map(({ label, href, icono }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="contacto-red"
            >
              {icono}
              {label}
            </a>
          ))}
        </div>
    </section>
  );
}
