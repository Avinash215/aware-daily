import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Read a story aloud with the browser's own speech engine: no network, no
 * cost, nothing leaves the device. Text is queued as short sentence groups
 * because some engines stop a single long utterance after about 15 seconds.
 */

function engine() {
  if (typeof window === 'undefined') return null
  const synth = window.speechSynthesis
  return synth && typeof window.SpeechSynthesisUtterance === 'function' ? synth : null
}

export const speechSupported = () => Boolean(engine())

// Every character lands in exactly one piece: a run ending in sentence
// punctuation (plus closing quotes and trailing space), or the remainder.
const SENTENCE = /[^.!?\u2026]*[.!?\u2026]+["'\u2019\u201d)\]]*\s*|[^.!?\u2026]+$/g

/**
 * Text in chunks of at most `max` characters, in order and unaltered. Chunks
 * break only after a sentence that ends in a space, so "U.S.A." stays whole;
 * an overlong sentence is split at a word boundary.
 */
export function speechChunks(parts, max = 220) {
  const chunks = []
  const push = (text) => {
    const trimmed = text.trim()
    if (trimmed) chunks.push(trimmed)
  }
  for (const part of parts) {
    const text = String(part ?? '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    let current = ''
    for (const piece of text.match(SENTENCE) || [text]) {
      if (current && /\s$/.test(current) && current.length + piece.trimEnd().length > max) {
        push(current)
        current = ''
      }
      current += piece
      while (current.trim().length > max) {
        const cut = current.lastIndexOf(' ', max)
        const at = cut > max / 2 ? cut : max
        push(current.slice(0, at))
        current = current.slice(at).replace(/^\s+/, '')
      }
    }
    push(current)
  }
  return chunks
}

export function useSpeech() {
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  const run = useRef(0)

  useEffect(() => () => {
    run.current += 1
    engine()?.cancel()
  }, [])

  const stop = useCallback(() => {
    run.current += 1
    engine()?.cancel()
    setState('idle')
  }, [])

  const play = useCallback((parts) => {
    const synth = engine()
    const chunks = speechChunks(parts)
    if (!synth || !chunks.length) return
    const id = run.current + 1
    run.current = id
    synth.cancel()
    setMessage('')
    setState('playing')
    const lang = document.documentElement.lang || 'en'
    chunks.forEach((text, index) => {
      const utterance = new window.SpeechSynthesisUtterance(text)
      utterance.lang = lang
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          if (run.current === id) setState('idle')
        }
      }
      utterance.onerror = (event) => {
        if (run.current !== id || event?.error === 'interrupted' || event?.error === 'canceled') return
        run.current += 1
        synth.cancel()
        setState('idle')
        setMessage('This browser could not read the story aloud.')
      }
      synth.speak(utterance)
    })
  }, [])

  const pause = useCallback(() => {
    engine()?.pause()
    setState('paused')
  }, [])

  const resume = useCallback(() => {
    engine()?.resume()
    setState('playing')
  }, [])

  return { state, message, play, pause, resume, stop }
}
