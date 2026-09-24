export const QUIZ_RESULT_FORMAT = 'paired-v1'
export const INVALID_QUIZ_RESULT = 'This quiz result could not be recorded: a completed quiz needs a whole-number score between zero and its positive question count.'

export function validQuizResult(score, total) {
  return Number.isSafeInteger(score) && Number.isSafeInteger(total) &&
    total > 0 && score >= 0 && score <= total
}

// Cross-products avoid rounding close accuracies; exact ties keep the earlier result.
export function betterQuizResult(previous, next) {
  if (!previous) return next
  const difference = BigInt(next.best) * BigInt(previous.total) - BigInt(previous.best) * BigInt(next.total)
  return difference > 0n || (difference === 0n && next.total > previous.total) ? next : previous
}

export function verifiedQuizResult(record) {
  return record?.format === QUIZ_RESULT_FORMAT && validQuizResult(record.best, record.total) ? record : null
}

export function recordQuizResult(previous, score, total, at) {
  if (!validQuizResult(score, total)) throw new Error(INVALID_QUIZ_RESULT)
  const prior = verifiedQuizResult(previous)
  const best = betterQuizResult(prior, { best: score, total, bestAt: at })
  const legacy = prior ? prior.legacy : previous
  return {
    best: best.best,
    total: best.total,
    attempts: (previous?.attempts || 0) + 1,
    lastAt: at,
    format: QUIZ_RESULT_FORMAT,
    bestAt: best.bestAt,
    ...(legacy ? { legacy } : {}),
  }
}

export function quizScoreLabel(record, completed) {
  const verified = verifiedQuizResult(record)
  const best = completed && validQuizResult(completed.score, completed.total)
    ? betterQuizResult(verified, { best: completed.score, total: completed.total })
    : verified
  const legacy = verified ? verified.legacy : record
  const labels = []
  if (best) labels.push(`Best this edition: ${best.best} of ${best.total}`)
  if (legacy) labels.push(`Unverified legacy score: ${legacy.best} of ${legacy.total} (not a confirmed attempt)`)
  return labels.join('. ') || 'Test yourself on what you read'
}
