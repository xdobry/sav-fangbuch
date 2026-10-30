export type Precipitation = 'Kein' | 'Leicht' | 'Mittel' | 'Stark'
export type RodType = 'Teleskop' | 'Feeder' | 'Karpfenrute' | 'Barschrute' | 'Sonstige'
export type BaitKind = 'Lebend' | 'Kunstköder' | 'Organisch'

export type Water = {
  id: string
  name: string
  location: string
  latitude?: number
  longitude?: number
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
  name: string
  kind: BaitKind
}

export type Montage = {
  id: string
  title: string
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
  montageId?: string
  montageWeight?: number
  retained?: boolean
  latitude?: number
  longitude?: number
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
  windSpeed10m?: number
  windDirection10m?: number
  weatherCode?: number
  sunrise?: string
  sunset?: string
  waterId: string
}

export type FangbuchData = {
  waters: Water[]
  rods: Rod[]
  baits: Bait[]
  montages: Montage[]
  sessions: FishingSession[]
  catches: CatchEntry[]
}

export type FishingSessionForm = Omit<FishingSession, 'id'>
export type PhotoMetadata = {
  time: string
  latitude: number
  longitude: number
}

export type PhotoSessionPlan =
  | { kind: 'existing'; session: FishingSession }
  | { kind: 'new' | 'manual'; session: FishingSessionForm }

export type CatchForm = Omit<CatchEntry, 'id' | 'sessionId'>
export type WaterForm = Omit<Water, 'id'>
export type BaitForm = Omit<Bait, 'id'>
export type MontageForm = Pick<Montage, 'title'>
export type RodForm = Omit<Rod, 'id'>
