import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { firstFuture, formatDate, isUpcoming, parseSchedule, timeLeft, weekendDates } from '../src/calendar.ts'

const payload = JSON.parse(await readFile(new URL('../public/schedule-2026.json', import.meta.url), 'utf8'))
const weekends = parseSchedule(payload, 2026)
const vegas = weekends.find(race => race.title === 'Лас-Вегас')

test('the snapshot covers the season and matches the official Las Vegas timetable', () => {
  assert.equal(weekends.length, 23)
  assert.equal(weekendDates(vegas), '19–21 ноября')
  assert.equal(vegas.sessions.length, 5)
  assert.equal(vegas.sessions[0].start, Date.parse('2026-11-20T00:30:00Z'))
  assert.equal(formatDate(vegas.sessions[0].start, 'Europe/Moscow', { hour: '2-digit', minute: '2-digit' }), '03:30')
  assert.equal(formatDate(vegas.sessions[0].start, vegas.zone, { hour: '2-digit', minute: '2-digit' }), '16:30')
})

test('countdown never goes negative and advances to the next session at the start', () => {
  const first = vegas.sessions[0]
  assert.deepEqual(timeLeft(first.start, first.start - 1), [0, 0, 0, 1])
  assert.deepEqual(timeLeft(first.start, first.start + 1000), [0, 0, 0, 0])
  assert.equal(firstFuture(vegas, first.start), vegas.sessions[1])
  assert.equal(isUpcoming(vegas, vegas.sessions.at(-1).start), false)
})

test('the sprint timetable is chronological and missing times stay unknown', () => {
  const china = weekends.find(race => race.title === 'Китай')
  assert.equal(china.sessions.find(session => session.key === 'Sprint').name, 'Спринт')
  assert.equal(china.sessions.filter(session => session.name === 'Квалификация к спринту').length, 1)
  assert.deepEqual(china.sessions.map(session => session.start), china.sessions.map(session => session.start).sort((a,b) => a-b))
  const withoutTime = structuredClone(payload)
  delete withoutTime.MRData.RaceTable.Races[20].FirstPractice.time
  assert.equal(parseSchedule(withoutTime, 2026)[20].sessions.find(s => s.key === 'FirstPractice').start, null)
})

test('incomplete responses are rejected before replacing cached data', () => {
  assert.throws(() => parseSchedule(payload, 2027))
  assert.throws(() => parseSchedule({ MRData: { total: '23', RaceTable: { season: '2026', Races: [] } } }, 2026))
})

