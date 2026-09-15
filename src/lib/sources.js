const text = (value) => typeof value === 'string' ? value : ''

export function normaliseSource(raw) {
  const entry = typeof raw === 'string' ? { url: raw } : raw
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null

  const source = {
    source: text(entry.source),
    title: text(entry.title),
    url: text(entry.url),
  }
  return Object.values(source).some((value) => value.trim()) ? source : null
}

export function normaliseSources(raw) {
  return (Array.isArray(raw) ? raw : []).map(normaliseSource).filter(Boolean)
}

export function parseSourceUrl(value) {
  // Require an authored scheme and authority, not the URL parser's recovery.
  // Whitespace, controls, backslashes and broken escapes are not accepted.
  if (typeof value !== 'string' ||
      !/^https?:\/\/[^/?#]+(?:[/?#]|$)/i.test(value) ||
      /[\s\\]|\p{Cc}/u.test(value) ||
      /%(?![0-9a-f]{2})/i.test(value)) return null

  try {
    const parsed = new URL(value)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname
      ? parsed
      : null
  } catch {
    return null
  }
}
