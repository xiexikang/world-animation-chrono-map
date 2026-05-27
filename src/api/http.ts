import { API_BASE_URL } from '@/config'
import type { ApiResponse } from '@/types/api'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new ApiError(`响应不是有效 JSON (${res.status})`, res.status)
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    throw new ApiError(`请求失败 (${res.status})`, res.status)
  }
  const body = await parseJson<ApiResponse<T>>(res)
  if (body.code !== 0) {
    throw new ApiError(body.message || '接口返回错误', res.status, body.code)
  }
  return body.data
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new ApiError(`请求失败 (${res.status})`, res.status)
  }
  const body = await parseJson<ApiResponse<T>>(res)
  if (body.code !== 0) {
    throw new ApiError(body.message || '接口返回错误', res.status, body.code)
  }
  return body.data
}
