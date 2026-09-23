// Integration check against Azurite: `npx azurite` running, then
// `node test/tables.integration.mjs`. Not part of `npm test`.
import assert from 'node:assert/strict'
import { createSocial } from '../src/lib/social.js'
import { createTableStore } from '../src/lib/store.js'

const store = createTableStore('UseDevelopmentStorage=true')
const run = Date.now().toString(36)
const ref = { edition: '2026-09-03', storyId: `integration-${run}`, headline: 'Integration story', category: 'Test' }
const principal = (id, details, roles = ['anonymous', 'authenticated']) => ({ userId: `u${id}${run}`, provider: 'github', userDetails: details, roles })
const social = createSocial({ store, moderators: ['github:avinash215'] })

const alice = principal(1, 'alice')
const bob = principal(2, 'bob')
const moderator = principal(9, 'Avinash215')

assert.deepEqual(await social.toggleLike(alice, ref), { liked: true, likes: 1 })
assert.deepEqual(await social.toggleLike(bob, ref), { liked: true, likes: 2 })
assert.deepEqual(await social.toggleLike(alice, ref), { liked: false, likes: 1 })
const stats = await social.stats(bob, { edition: ref.edition })
assert.equal(stats.stats[ref.storyId].likes, 1)
assert.ok(stats.mine.includes(ref.storyId))

const { comment } = await social.addComment(alice, { ...ref, text: "It's worth watching.", displayName: "Alice O'Neil" })
assert.equal(comment.status, 'pending')
const queue = await social.moderationQueue(moderator)
const mine = queue.pending.find((entry) => entry.id === comment.id)
assert.ok(mine, 'pending comment is in the queue (string filter with a quote in the data)')
await social.moderate(moderator, { storyKey: mine.storyKey, commentId: mine.id, action: 'approve' })
await social.report(bob, { ...ref, commentId: comment.id })
const reported = (await social.moderationQueue(moderator)).reported.find((entry) => entry.id === comment.id)
assert.equal(reported?.reports, 1, 'boolean filter finds reported comments')
await social.moderate(moderator, { storyKey: mine.storyKey, commentId: mine.id, action: 'hide' })
assert.equal((await social.listComments(null, ref)).comments.length, 0)

const board = await social.leaderboard(null, { days: 30, today: '2026-09-03' })
assert.ok(board.stories.some((story) => story.storyId === ref.storyId && story.likes === 1))

// Concurrent likes must not lose counts through the ETag retry loop.
const many = Array.from({ length: 12 }, (_, index) => principal(100 + index, `reader${index}`))
await Promise.all(many.map((reader) => social.toggleLike(reader, ref)))
assert.equal((await social.stats(null, { edition: ref.edition })).stats[ref.storyId].likes, 13)

console.log('AZURITE INTEGRATION PASSED')
