import type { Bait, CatchEntry, FangbuchData, FishSpecies, FishingSession, Montage, Rod, Water } from '../types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isImportedSession = (value: unknown): value is FishingSession => {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.from === 'string'
    && typeof value.to === 'string'
    && typeof value.waterId === 'string'
    && typeof value.temperature === 'number'
    && Number.isFinite(value.temperature)
    && typeof value.population === 'number'
    && Number.isFinite(value.population)
    && ['Kein', 'Leicht', 'Mittel', 'Stark'].includes(String(value.precipitation))
}

const isImportedCatch = (value: unknown): value is CatchEntry => {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.sessionId === 'string'
    && typeof value.time === 'string'
    && typeof value.speciesId === 'string'
    && typeof value.lengthCm === 'number'
    && Number.isFinite(value.lengthCm)
    && typeof value.rodId === 'string'
    && typeof value.baitId === 'string'
}

const isImportedWater = (value: unknown): value is Water =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.name === 'string'
  && typeof value.location === 'string'

const isImportedRod = (value: unknown): value is Rod =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.type === 'string'
  && typeof value.length === 'number'
  && Number.isFinite(value.length)

const isImportedBait = (value: unknown): value is Bait =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.name === 'string'
  && typeof value.kind === 'string'

const isImportedMontage = (value: unknown): value is Montage =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.title === 'string'

const readImportArray = <T>(
  data: Record<string, unknown>,
  key: string,
  isItem: (value: unknown) => value is T,
  required = false
): T[] => {
  const value = data[key]
  if (value === undefined && !required) return []
  if (!Array.isArray(value) || !value.every(isItem)) {
    throw new Error(`Die JSON-Datei enthält keine gültige Liste „${key}“.`)
  }
  return value
}

const mergeById = <T extends { id: string }>(current: T[], imported: T[]) => {
  const existingIds = new Set(current.map((entry) => entry.id))
  const additions = imported.filter((entry) => {
    if (existingIds.has(entry.id)) return false
    existingIds.add(entry.id)
    return true
  })
  return [...current, ...additions]
}

export const importJsonData = (content: string, current: FangbuchData) => {
  const parsed: unknown = JSON.parse(content)
  if (!isRecord(parsed)) throw new Error('Die JSON-Datei enthält kein gültiges Datenobjekt.')
  const importedSessions = readImportArray(parsed, 'sessions', isImportedSession, true)
  const importedCatches = readImportArray(parsed, 'catches', isImportedCatch, true)
  const importedWaters = readImportArray(parsed, 'waters', isImportedWater)
  const importedRods = readImportArray(parsed, 'rods', isImportedRod)
  const importedBaits = readImportArray(parsed, 'baits', isImportedBait)
  const importedMontages = readImportArray(parsed, 'montages', isImportedMontage)
  const allSessionIds = new Set([...current.sessions, ...importedSessions].map((entry) => entry.id))
  if (importedCatches.some((entry) => !allSessionIds.has(entry.sessionId))) {
    throw new Error('Mindestens ein Fang verweist auf eine Tour, die weder lokal noch im Import vorhanden ist.')
  }

  const existingSessionIds = new Set(current.sessions.map((entry) => entry.id))
  const existingCatchIds = new Set(current.catches.map((entry) => entry.id))
  const data: FangbuchData = {
    waters: mergeById(current.waters, importedWaters),
    rods: mergeById(current.rods, importedRods),
    baits: mergeById(current.baits, importedBaits),
    montages: mergeById(current.montages, importedMontages),
    sessions: mergeById(current.sessions, importedSessions),
    catches: mergeById(current.catches, importedCatches)
  }
  return {
    data,
    addedSessions: data.sessions.filter((entry) => !existingSessionIds.has(entry.id)).length,
    addedCatches: data.catches.filter((entry) => !existingCatchIds.has(entry.id)).length
  }
}

const downloadFile = (content: BlobPart, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const exportJsonFile = (data: FangbuchData) => {
  downloadFile(
    JSON.stringify(data, null, 2),
    `fangbuch-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json'
  )
}

export const createCsv = (data: FangbuchData, species: FishSpecies[]) => {
  const { sessions, catches, waters, rods, baits, montages } = data
  const columns = [
    'session_id', 'session_from', 'session_to', 'water_id', 'water_name',
    'temperature_c', 'cloud_cover_percent', 'precipitation', 'wind_speed_kmh',
    'wind_direction_degrees', 'weather_code', 'sunrise', 'sunset', 'catch_id', 'catch_time',
    'species_id', 'species_name', 'length_cm', 'weight_kg', 'rod_id',
    'rod_type', 'rod_length_m', 'bait_id', 'bait_name', 'bait_kind',
    'montage_id', 'montage_title', 'montage_weight', 'retained',
    'latitude', 'longitude', 'photo', 'notes'
  ]
  const quoteCsv = (value: unknown) => {
    const text = value === undefined || value === null ? '' : String(value)
    return `"${text.replaceAll('"', '""')}"`
  }
  const sessionById = new Map(sessions.map((session) => [session.id, session]))
  const rows = sessions.flatMap((session) => {
    const sessionCatches = catches.filter((entry) => entry.sessionId === session.id)
    return (sessionCatches.length ? sessionCatches : [null]).map((entry) => {
      const water = waters.find((item) => item.id === session.waterId)
      const speciesEntry = entry && species.find((item) => item.id === entry.speciesId)
      const rod = entry && rods.find((item) => item.id === entry.rodId)
      const bait = entry && baits.find((item) => item.id === entry.baitId)
      const montage = entry && montages.find((item) => item.id === entry.montageId)
      return [
        session.id, session.from, session.to, session.waterId, water?.name,
        session.temperature, session.population, session.precipitation, session.windSpeed10m,
        session.windDirection10m, session.weatherCode, session.sunrise, session.sunset, entry?.id, entry?.time,
        entry?.speciesId, speciesEntry?.name, entry?.lengthCm, entry?.weightKg, entry?.rodId,
        rod?.type, rod?.length, entry?.baitId, bait?.name, bait?.kind, entry?.montageId,
        montage?.title, entry?.montageWeight, entry?.retained, entry?.latitude,
        entry?.longitude, entry?.photo, entry?.notes
      ]
    })
  })
  const orphanCatches = catches.filter((entry) => !sessionById.has(entry.sessionId))
  for (const entry of orphanCatches) {
    rows.push([
      entry.sessionId, '', '', '', '', '', '', '', '', '', '', '', '', entry.id, entry.time,
      entry.speciesId, species.find((item) => item.id === entry.speciesId)?.name,
      entry.lengthCm, entry.weightKg, entry.rodId,
      rods.find((item) => item.id === entry.rodId)?.type,
      rods.find((item) => item.id === entry.rodId)?.length,
      entry.baitId, baits.find((item) => item.id === entry.baitId)?.name,
      baits.find((item) => item.id === entry.baitId)?.kind, entry.montageId,
      montages.find((item) => item.id === entry.montageId)?.title,
      entry.montageWeight, entry.retained, entry.latitude, entry.longitude, entry.photo, entry.notes
    ])
  }

  return [columns, ...rows].map((row) => row.map(quoteCsv).join(',')).join('\r\n')
}

export const exportCsvFile = (data: FangbuchData, species: FishSpecies[]) => {
  downloadFile(
    `\uFEFF${createCsv(data, species)}`,
    `fangbuch-${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8'
  )
}