import type { CreateInvoiceDTO } from './create-invoice-dto'
import type { InvoiceDTO } from './invoice-dto'

const API_URL = 'http://localhost:5118/notas'

async function ensureSuccessfulResponse(response: Response) {
  if (response.ok) {
    return
  }

  const details = await response.text()
  throw new Error(details || `A API retornou o status ${response.status}.`)
}

export async function getInvoices(signal?: AbortSignal) {
  const response = await fetch(API_URL, { signal })
  await ensureSuccessfulResponse(response)

  return (await response.json()) as InvoiceDTO[]
}

export async function createInvoice(invoice: CreateInvoiceDTO) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  })
  await ensureSuccessfulResponse(response)

  return (await response.json()) as InvoiceDTO
}
