import mitt from 'mitt'
import type { CountryCode } from '@/types'

export type CanvasEvents = {
  'node:click': string
  'node:focus': string
  'canvas:reset': void
  'country:focus': CountryCode | 'ALL'
}

export const canvasEmitter = mitt<CanvasEvents>()
