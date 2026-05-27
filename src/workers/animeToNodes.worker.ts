import { animeItemsToNodes } from '../lib/convertAnimeItems'
import type { ThemeDictionary } from '../lib/themeDictionary'
import type { AnimeItem } from '../types/api'

type WorkerRequest = {
  type: 'convert'
  items: AnimeItem[]
  dictionary: ThemeDictionary
}

type WorkerResponse = {
  type: 'result'
  nodes: ReturnType<typeof animeItemsToNodes>
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const data = event.data
  if (data.type !== 'convert') return
  const nodes = animeItemsToNodes(data.items, data.dictionary)
  const response: WorkerResponse = { type: 'result', nodes }
  self.postMessage(response)
}

export {}
