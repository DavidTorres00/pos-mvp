import { isAxiosError, type AxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ detail?: string }>(error) && typeof error.response?.data?.detail === 'string') {
    return error.response.data.detail
  }
  return fallback
}

// sin `response` = la request nunca llegó a completar un ciclo HTTP (timeout, conexión
// rechazada, servidor caído) — distinto de un error de negocio normal (400/403/404 con
// `response`), que sí llegó al backend y este respondió con un rechazo válido. Type predicate
// para que el llamador pueda leer `.message`/`.code` ya tipados sin volver a castear.
export function esErrorDeRed(error: unknown): error is AxiosError {
  return isAxiosError(error) && error.response === undefined
}
