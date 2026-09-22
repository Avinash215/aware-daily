import { clamp } from './format.js'

/**
 * A grounded quiz on stories the reader has read.
 *
 * No model and no network: every question is built from fields the edition
 * already published, and every correct answer carries the published text it
 * came from, shown after the reader answers. Wrong options are drawn from
 * other stories in the same edition, or, for a number, are nearby values that
 * are marked wrong. Generation is deterministic for a given seed.
 */

function hash(text) {
  let value = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function rng(seed) {
  let state = hash(String(seed)) || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(list, random) {
  const out = list.slice()
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[out[index], out[swap]] = [out[swap], out[index]]
  }
  return out
}

const text = (value) => (typeof value === 'string' ? value.trim() : '')

function firstSentence(value) {
  const clean = text(value).replace(/\s+/g, ' ')
  const match = /^(.{30,}?[.!?])(\s|$)/.exec(clean)
  return match ? match[1] : clean
}

function pickOthers(random, pool, count, accept) {
  const out = []
  const seen = new Set()
  for (const candidate of shuffle(pool, random)) {
    const key = candidate.toLowerCase()
    if (seen.has(key) || !accept(candidate)) continue
    seen.add(key)
    out.push(candidate)
    if (out.length >= count) break
  }
  return out
}

function assemble(random, { story, type, prompt, context, answer, others, evidence }) {
  if (!answer || others.length < 2) return null
  const options = shuffle([answer, ...others], random).map((value, index) => ({ id: `o${index}`, text: value }))
  return {
    id: `${story.id}:${type}`,
    type,
    storyId: story.id,
    headline: text(story.headline),
    prompt,
    context,
    options,
    answerId: options.find((option) => option.text === answer).id,
    evidence,
  }
}

/* -------------------------------------------------------------- question types */

function whyItMatters(story, edition, random) {
  const answer = clamp(text(story.so_what), 170)
  if (!answer) return null
  const others = pickOthers(random, edition.filter((entry) => entry.id !== story.id)
    .map((entry) => clamp(text(entry.so_what), 170)).filter(Boolean), 3, (value) => value !== answer)
  return assemble(random, {
    story,
    type: 'why',
    prompt: 'Why does this story matter?',
    context: text(story.headline),
    answer,
    others,
    evidence: { label: 'So what, as published', text: text(story.so_what) },
  })
}

function whichStory(story, edition, random) {
  const sentence = firstSentence(story.dek || story.body)
  const answer = text(story.headline)
  if (!answer || sentence.length < 40) return null
  const others = pickOthers(random, edition.filter((entry) => entry.id !== story.id)
    .map((entry) => text(entry.headline)).filter(Boolean), 3, (value) => value !== answer)
  return assemble(random, {
    story,
    type: 'which',
    prompt: 'Which story does this describe?',
    context: clamp(sentence, 240),
    answer,
    others,
    evidence: { label: 'From the story', text: sentence },
  })
}

const NUMBER = /(^|[\s(])(\$?\d{1,3}(?:,\d{3})+|\$?\d+(?:\.\d+)?)(%?)(?=[\s,.)]|$)/g

function formatLike(value, template) {
  const decimals = template.includes('.') ? (template.split('.')[1] || '').length : 0
  const rounded = decimals ? value.toFixed(decimals) : String(Math.round(value))
  return template.includes(',') ? Number(rounded).toLocaleString('en-US') : rounded
}

function numberCloze(story, edition, random) {
  const headline = text(story.headline)
  NUMBER.lastIndex = 0
  let match
  while ((match = NUMBER.exec(headline))) {
    const [, lead, raw, percent] = match
    const start = match.index + lead.length
    const after = headline.slice(start + raw.length + percent.length)
    const nextWord = /^\s+(\S+)/.exec(after)?.[1] || ''
    const digits = raw.replace(/[$,]/g, '')
    const value = Number(digits)
    const isYear = /^\d{4}$/.test(digits) && value >= 1900 && value <= 2100
    // "10 Downing Street" and "2 Pennsylvania deaths" are names, not figures.
    if (!Number.isFinite(value) || value <= 0 || isYear || /^[A-Z]/.test(nextWord)) continue

    const dollar = raw.startsWith('$') ? '$' : ''
    const template = raw.replace('$', '')
    const token = `${raw}${percent}`
    const factors = value < 10 ? [2, 3, 0.5, 4] : [0.5, 1.5, 2, 3, 0.25]
    const others = pickOthers(random, factors.map((factor) => {
      const candidate = value < 10 ? Math.max(1, Math.round(value * factor)) : value * factor
      return `${dollar}${formatLike(candidate, template)}${percent}`
    }), 3, (candidate) => candidate !== token && candidate !== `${dollar}${formatLike(value, template)}${percent}`)

    return assemble(random, {
      story,
      type: 'number',
      prompt: 'Fill in the missing figure.',
      context: `${headline.slice(0, start)}____${headline.slice(start + token.length)}`,
      answer: token,
      others,
      evidence: { label: 'Headline, as published', text: headline },
    })
  }
  return null
}

function whichCountry(story, edition, random) {
  const headline = text(story.headline).toLowerCase()
  const reporting = [text(story.dek), text(story.body)].join(' ')
  const actor = (story.countries || []).find((country) => {
    const name = text(country?.name)
    return name && country.role === 'actor' && !headline.includes(name.toLowerCase())
      && reporting.toLowerCase().includes(name.toLowerCase())
  })
  if (!actor) return null
  const own = new Set((story.countries || []).map((country) => text(country?.name).toLowerCase()))
  const others = pickOthers(random, edition.flatMap((entry) => (entry.countries || []).map((country) => text(country?.name)))
    .filter(Boolean), 3, (name) => !own.has(name.toLowerCase()))
  const sentence = reporting.split(/(?<=[.!?])\s+/).find((part) => part.toLowerCase().includes(actor.name.toLowerCase())) || ''
  return assemble(random, {
    story,
    type: 'country',
    prompt: 'Which country is at the centre of this story?',
    context: text(story.headline),
    answer: actor.name,
    others,
    evidence: { label: 'From the story', text: clamp(sentence, 280) },
  })
}

// Order matters for fallback: when a rotated type cannot be built for a story,
// the next one is tried, so the always-available `why` should not absorb
// every miss.
const GENERATORS = [whyItMatters, numberCloze, whichStory, whichCountry]

/**
 * Up to `count` questions about `pool`, using `edition` for wrong options.
 * Types rotate so one quiz mixes kinds of recall; a story gets a second
 * question only when there are fewer stories than questions.
 */
export function buildQuiz(pool, edition, { seed = 'aware', count = 5 } = {}) {
  const random = rng(seed)
  const stories = shuffle(pool.filter((story) => story && typeof story.id === 'string'), random)
  const questions = []
  const used = new Set()
  let turn = Math.floor(random() * GENERATORS.length)

  for (let pass = 0; pass < 2 && questions.length < count; pass += 1) {
    for (const story of stories) {
      if (questions.length >= count) break
      for (let offset = 0; offset < GENERATORS.length; offset += 1) {
        const slot = (turn + offset) % GENERATORS.length
        const question = GENERATORS[slot](story, edition, random)
        if (question && !used.has(question.id)) {
          used.add(question.id)
          questions.push(question)
          // Rotate from the type actually used, so a fallback is not repeated next.
          turn = slot + 1
          break
        }
      }
    }
  }
  return questions
}

/** Fewest read stories that make a quiz worth taking. */
export const QUIZ_MIN_READ = 3
