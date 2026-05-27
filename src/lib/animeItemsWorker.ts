import { animeItemsToNodes } from '@/lib/convertAnimeItems'
import type { ThemeDictionary } from '@/lib/themeDictionary'
import type { AnimeItem } from '@/types/api'
import type { AnimationNode } from '@/types'

const WORKER_THRESHOLD = 60

type WorkerRequest = {
  type: 'convert'
  items: AnimeItem[]
  dictionary: ThemeDictionary
}

type WorkerResponse = {
  type: 'result'
  nodes: AnimationNode[]
}

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/animeToNodes.worker.ts', import.meta.url),
      { type: 'module' },
    )
  }
  return worker
}

export function animeItemsToNodesAsync(
  items: AnimeItem[],
  themeDictionary: ThemeDictionary,
): Promise<AnimationNode[]> {
  if (items.length < WORKER_THRESHOLD) {
    return Promise.resolve(animeItemsToNodes(items, themeDictionary))
  }

  return new Promise((resolve, reject) => {
    const w = getWorker()
    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'result') {
        cleanup()
        resolve(event.data.nodes)
      }
    }
    const onError = (err: ErrorEvent) => {
      cleanup()
      reject(err.error ?? err)
    }
    const cleanup = () => {
      w.removeEventListener('message', onMessage)
      w.removeEventListener('error', onError)
    }

    w.addEventListener('message', onMessage)
    w.addEventListener('error', onError)
    const payload: WorkerRequest = {
      type: 'convert',
      items,
      dictionary: themeDictionary,
    }
    w.postMessage(payload)
  })
}
