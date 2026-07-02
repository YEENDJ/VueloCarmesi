const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${BASE}/site-config`, { next: { revalidate: 300, tags: ['site-config'] } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return {}
  }
}
