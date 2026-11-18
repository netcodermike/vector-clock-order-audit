import { readFileSync } from 'node:fs'

function analyze({ events }) {
  if (!Array.isArray(events) || !events.length || events.length > 200) throw Error('Provide 1 to 200 events')
  const width = events[0]?.clock?.length
  const names = new Set()
  for (const { id, clock } of events) {
    if (typeof id !== 'string' || !id.trim() || names.has(id) || !width || !Array.isArray(clock) || clock.length !== width || !clock.every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw Error('Each event requires a unique ID and a vector of nonnegative integer counters of equal length')
    }
    names.add(id)
  }
  const pairs = []
  let ordered = 0, concurrent = 0, equal = 0
  for (let i = 0; i < events.length; i++) {
    for (const b of events.slice(i + 1)) {
      const a = events[i]
      const lower = a.clock.some((value, j) => value < b.clock[j])
      const higher = a.clock.some((value, j) => value > b.clock[j])
      if (lower && higher) { concurrent++; pairs.push({ a: a.id, b: b.id, relation: 'concurrent' }) }
      else if (!lower && !higher) { equal++; pairs.push({ a: a.id, b: b.id, relation: 'equal' }) }
      else {
        ordered++
        pairs.push({ a: lower ? a.id : b.id, b: lower ? b.id : a.id, relation: 'before' })
      }
    }
  }
  return { ordered, concurrent, equal, pairs }
}

try {
  if (process.argv.length !== 3) throw new Error('Usage: node app.mjs input.json')
  console.log(JSON.stringify(analyze(JSON.parse(readFileSync(process.argv[2], 'utf8')))))
} catch (error) {
  console.error(error.message)
  process.exitCode = 2
}
