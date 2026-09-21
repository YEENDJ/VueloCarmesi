"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AvisoDatos from "@/components/ui/AvisoDatos";
import IconoWhatsapp from "@/components/ui/IconoWhatsapp";
import {
  IconoInstagram,
  IconoFacebook,
  IconoTiktok,
} from "@/components/ui/IconosRedes";
import { CONTACTO, MENSAJE_WHATSAPP, REDES, whatsappCon } from "@/lib/contacto";
import AvisoGrupos from "@/components/grupos/AvisoGrupos";

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
  const t = useTranslations("contacto");

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
      {/* Arriba del formulario y no al pie: esta página es donde cae hoy el
          tráfico institucional —un coordinador que no encontró capacidad de
          grupo en ningún otro sitio— y el formulario de acá pide tres campos
          que no sirven para cotizar. Es el desvío de mayor rendimiento del
          proyecto y hay que verlo antes de empezar a escribir el mensaje. */}
      <AvisoGrupos variante="contacto" />

      <div className="contacto-grid">
        <div className="contacto-formulario">
          <h2 className="contacto-subtitulo">{t("escribenos")}</h2>
          {estado === "ok" ? (
            <p style={{ color: "var(--color-crimson)", fontSize: "1.1rem" }}>
              {t("gracias")}
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
                label={t("nombre")}
                name="nombre"
                required
                value={form.nombre}
                onChange={handleChange}
              />
              <Input
                label={t("email")}
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
              />
              <Input
                label={t("mensaje")}
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
                  {t("error", { email: CONTACTO.email })}
                </p>
              )}
              <Button type="submit" disabled={estado === "loading"}>
                {estado === "loading" ? t("enviando") : t("enviar")}
              </Button>
              <AvisoDatos />
            </form>
          )}
        </div>

        <aside
          className="contacto-canales"
          aria-label={t("otrasFormasAria")}
        >
          <h2 className="contacto-subtitulo">{t("otrasFormas")}</h2>

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
              <span className="contacto-canal-nota">{t("whatsappNota")}</span>
            </span>
          </a>

          <a href={`tel:${CONTACTO.telefonoE164}`} className="contacto-canal">
            <span className="contacto-canal-icono" aria-hidden="true">
              📞
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">{t("llamanos")}</span>
              <span className="contacto-canal-dato">{CONTACTO.telefono}</span>
            </span>
          </a>

          <a href={`mailto:${CONTACTO.email}`} className="contacto-canal">
            <span className="contacto-canal-icono" aria-hidden="true">
              ✉️
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">{t("correo")}</span>
              <span className="contacto-canal-dato">{CONTACTO.email}</span>
            </span>
          </a>

          <div className="contacto-canal contacto-canal-estatico">
            <span className="contacto-canal-icono" aria-hidden="true">
              📍
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">{t("dondeEstamos")}</span>
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
