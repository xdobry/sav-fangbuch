import { load, type ExpandedTags } from 'exifreader'
import type { PhotoMetadata } from '../types'

const parseExifTime = (value: string | undefined): string | null => {
  const match = value?.trim().match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(hour, minute, second, 0)
  if (
    year < 1
    || date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date.getUTCHours() !== hour
    || date.getUTCMinutes() !== minute
    || date.getUTCSeconds() !== second
  ) return null

  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`
}

export const parsePhotoMetadata = (tags: ExpandedTags): PhotoMetadata | null => {
  const time = parseExifTime(tags.exif?.DateTimeOriginal?.value[0])
    ?? parseExifTime(tags.exif?.DateTimeDigitized?.value[0])
  const latitude = tags.gps?.Latitude
  const longitude = tags.gps?.Longitude
  if (
    !time
    || latitude === undefined || longitude === undefined
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90
    || longitude < -180 || longitude > 180
  ) return null

  return { time, latitude, longitude }
}

export const readPhotoMetadata = async (file: File): Promise<PhotoMetadata | null> => {
  const buffer = await file.arrayBuffer()
  try {
    return parsePhotoMetadata(load(buffer, { expanded: true }))
  } catch {
    return null
  }
}