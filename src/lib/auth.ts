export function getCookie(name: string): string | null {
  return document.cookie.split('; ').reduce<string | null>((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

// Cookies hub_ui / hub_admin_ui jsou jen UX nápověda (co ukázat, kam
// přesměrovat). Skutečný přístup hlídá serverový middleware proti D1.
export function isAuthed(): boolean {
  return getCookie('hub_ui') === '1'
}

export function isAdmin(): boolean {
  return getCookie('hub_admin_ui') === '1'
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' })
}

export type ModuleKey = 'zalivka' | 'spirala' | 'geckos' | 'polymarket'

export type Me = {
  username: string
  role: 'admin' | 'user'
  modules: ModuleKey[]
  pending_count?: number
}

/** Přihlášený uživatel, nebo null (session neplatí / účet zablokovaný). */
export async function fetchMe(): Promise<Me | null> {
  try {
    const res = await fetch('/api/me')
    if (!res.ok) return null
    return (await res.json()) as Me
  } catch {
    return null
  }
}

// Serverové kódy chyb z /api/login, /api/register a /api/account → čeština.
export const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: 'Nesprávné jméno nebo heslo.',
  too_many_attempts: 'Příliš mnoho pokusů. Zkus to znovu za 15 minut.',
  pending: 'Účet čeká na schválení. Ozvu se, až ho povolím.',
  disabled: 'Účet je zablokovaný.',
  invalid_username: 'Jméno: 3 až 32 znaků, jen malá písmena, čísla a . _ -',
  password_too_short: 'Heslo musí mít aspoň 10 znaků.',
  password_too_long: 'Heslo je příliš dlouhé.',
  password_contains_username: 'Heslo nesmí obsahovat uživatelské jméno.',
  username_taken: 'Tohle jméno už někdo má.',
  registrations_paused: 'Registrace jsou dočasně pozastavené.',
  wrong_password: 'Současné heslo nesedí.',
  same_password: 'Nové heslo je stejné jako současné.',
}

export function authError(code: string | undefined, fallback = 'Něco se pokazilo.'): string {
  return (code && AUTH_ERRORS[code]) || fallback
}
