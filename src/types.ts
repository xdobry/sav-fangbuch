export type Precipitation = 'Kein' | 'Leicht' | 'Stark'
export type RodType = 'Teleskop' | 'Feeder' | 'Karpfenrute' | 'Barschrute' | 'Sonstige'
export type BaitKind = 'Lebend' | 'Kunstköder'
export type BaitCategory = 'Vorfach' | 'Haken' | 'Köder'

export type Water = {
  id: string
  name: string
  location: string
}

export type FishSpecies = {
  id: string
  name: string
}

export type Rod = {
  id: string
  type: RodType
  length: number
}

export type Bait = {
  id: string
  category: BaitCategory
  name: string
  kind: BaitKind
}

export type CatchEntry = {
  id: string
  sessionId: string
  time: string
  speciesId: string
  lengthCm: number
  weightKg?: number
  rodId: string
  baitId: string
  photo?: string
  notes?: string
}

export type FishingSession = {
  id: string
  from: string
  to: string
  temperature: number
  population: number
  precipitation: Precipitation
  waterId: string
}

export type FishingSessionForm = Omit<FishingSession, 'id'>
export type CatchForm = Omit<CatchEntry, 'id' | 'sessionId'>
export type WaterForm = Pick<Water, 'name' | 'location'>
export type BaitForm = Omit<Bait, 'id'>
export type RodForm = Omit<Rod, 'id'>
