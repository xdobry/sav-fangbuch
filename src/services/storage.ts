import { defaultBaits, defaultMontages, defaultRods, defaultWaters } from '../data/defaults'
import type { CatchEntry, FangbuchData, FishingSession, Montage } from '../types'
import { createId } from '../utils/createId'

const storageKey = 'fangbuch-data-v1'

type StoredData = Omit<Partial<FangbuchData>, 'catches'> & {
  catches?: (CatchEntry & { waterId?: string })[]
}

export const loadStoredData = (): { data: FangbuchData; needsSave: boolean } | null => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null

  const parsed: StoredData = JSON.parse(raw)
  const waters = parsed.waters?.length ? parsed.waters : defaultWaters.map((water) => ({ ...water }))
  const rods = parsed.rods?.length ? parsed.rods : defaultRods.map((rod) => ({ ...rod }))
  const baits = parsed.baits?.length ? parsed.baits : defaultBaits.map((bait) => ({ ...bait }))
  const storedMontages: Montage[] = Array.isArray(parsed.montages)
    ? parsed.montages.map(({ id, title }) => ({ id, title }))
    : []
  const storedMontageIds = new Set(storedMontages.map((montage) => montage.id))
  const montages = [
    ...storedMontages,
    ...defaultMontages
      .filter((montage) => !storedMontageIds.has(montage.id))
      .map((montage) => ({ ...montage }))
  ]
  const sessions = parsed.sessions ?? []
  const loadedCatches = parsed.catches ?? []
  let migratedCatches = false
  const storedSpecies = Object.prototype.hasOwnProperty.call(parsed, 'species')

  const catches = loadedCatches.map((entry) => {
    if (entry.sessionId && sessions.some((session) => session.id === entry.sessionId)) return entry

    const matchingSession = sessions.find((session) =>
      session.waterId === entry.waterId && entry.time >= session.from && entry.time <= session.to
    )
    if (matchingSession) {
      migratedCatches = true
      return { ...entry, sessionId: matchingSession.id }
    }

    const waterId = waters.find((water) => water.id === entry.waterId)?.id
      ?? waters[0]?.id
      ?? ''
    const time = entry.time || new Date().toISOString().slice(0, 16)
    const migratedSession: FishingSession = {
      id: createId(),
      from: time,
      to: time,
      temperature: 0,
      population: 0,
      precipitation: 'Kein',
      waterId
    }
    sessions.unshift(migratedSession)
    migratedCatches = true
    return { ...entry, sessionId: migratedSession.id }
  })

  return {
    data: { waters, rods, baits, montages, sessions, catches },
    needsSave: migratedCatches || storedSpecies
  }
}

export const saveStoredData = (data: FangbuchData) => {
  localStorage.setItem(storageKey, JSON.stringify(data))
}