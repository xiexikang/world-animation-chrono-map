import mitt from 'mitt'

export type CanvasEvents = {
  'node:click': string
  'node:focus': string
  'canvas:reset': void
  /** 数据源国家码（/api/countries） */
  'country:focus': string | 'ALL'
}

export const canvasEmitter = mitt<CanvasEvents>()
