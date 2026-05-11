export function getCookie(name: string): string | null {
  return document.cookie.split('; ').reduce<string | null>((acc, c) => {
    const [k, v] = c.split('=')
    return k === name ? decodeURIComponent(v) : acc
  }, null)
}

export function isAuthed(): boolean {
  return getCookie('hub_ui') === '1'
}

export function isAdmin(): boolean {
  return getCookie('hub_admin_ui') === '1'
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' })
}
