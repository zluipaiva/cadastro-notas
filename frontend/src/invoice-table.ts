import $ from 'jquery'
import debounce from 'lodash/debounce'
import { getInvoices } from './api'
import {
  formatCreatedAt,
  formatCurrency,
  formatEmissionDate,
} from './formatters'
import type { InvoiceDTO } from './invoice-dto'

type SortOrder = 'asc' | 'desc'

export function createInvoiceTable($root: JQuery<HTMLElement>) {
  let invoices: InvoiceDTO[] = []
  let customerNameFilter = ''
  let sortOrder: SortOrder = 'asc'
  let activeRequest: AbortController | undefined
  const locallyAddedInvoices = new Map<number, InvoiceDTO>()

  $root.html(`
    <div class="row g-2 mb-4" role="search">
      <div class="col-sm">
        <label for="customer-search" class="visually-hidden">
          Buscar pelo nome do cliente
        </label>
        <input
          id="customer-search"
          data-search-input
          class="form-control"
          type="search"
          placeholder="Nome do cliente"
          autocomplete="off"
        />
      </div>
      <div class="col-sm-auto">
        <label for="value-sort" class="visually-hidden">
          Ordenar notas por valor
        </label>
        <select id="value-sort" data-sort-select class="form-select">
          <option value="asc" selected>Valor: crescente</option>
          <option value="desc">Valor: decrescente</option>
        </select>
      </div>
      <div class="col-sm-auto">
        <button
          data-reload-button
          class="btn btn-outline-primary w-100"
          type="button"
        >
          Recarregar
        </button>
      </div>
    </div>

    <div
      data-table-error
      class="alert alert-danger d-none"
      role="alert"
      aria-live="polite"
    ></div>

    <div class="table-responsive">
      <table class="table table-striped table-hover align-middle mb-0">
        <caption class="visually-hidden">Lista de notas fiscais cadastradas</caption>
        <thead class="table-light">
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Número</th>
            <th scope="col">Cliente</th>
            <th scope="col">Valor</th>
            <th scope="col">Emissão</th>
            <th scope="col">Cadastro</th>
          </tr>
        </thead>
        <tbody data-table-body aria-live="polite">
          <tr>
            <td class="py-4 text-center text-secondary" colspan="6">
              Carregando notas...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `)

  const $body = $root.find<HTMLTableSectionElement>('[data-table-body]')
  const $error = $root.find<HTMLElement>('[data-table-error]')
  const $searchInput = $root.find<HTMLInputElement>('[data-search-input]')
  const $sortSelect = $root.find<HTMLSelectElement>('[data-sort-select]')
  const $reloadButton = $root.find<HTMLButtonElement>('[data-reload-button]')

  const matchesFilter = (invoice: InvoiceDTO) =>
    invoice.customerName
      .toLocaleLowerCase('pt-BR')
      .includes(customerNameFilter.toLocaleLowerCase('pt-BR'))

  const render = () => {
    const visibleInvoices = invoices
      .filter(matchesFilter)
      .sort((firstInvoice, secondInvoice) => {
        const valueDifference = firstInvoice.value - secondInvoice.value

        return sortOrder === 'asc' ? valueDifference : -valueDifference
      })

    $body.empty()

    if (visibleInvoices.length === 0) {
      $('<tr>')
        .append(
          $('<td>', { colspan: 6 })
            .addClass('py-4 text-center text-secondary')
            .text(
              customerNameFilter
                ? 'Nenhuma nota encontrada para esse cliente.'
                : 'Nenhuma nota cadastrada.',
            ),
        )
        .appendTo($body)
      return
    }

    for (const invoice of visibleInvoices) {
      $('<tr>')
        .append($('<th>', { scope: 'row' }).text(invoice.id))
        .append($('<td>').text(invoice.invoiceNumber))
        .append($('<td>').text(invoice.customerName))
        .append($('<td>').text(formatCurrency(invoice.value)))
        .append($('<td>').text(formatEmissionDate(invoice.emissionDate)))
        .append($('<td>').text(formatCreatedAt(invoice.createdAt)))
        .appendTo($body)
    }
  }

  const addInvoice = (invoice: InvoiceDTO) => {
    locallyAddedInvoices.set(invoice.id, invoice)

    invoices.push(invoice)

    render()
  }

  const loadInvoices = async () => {
    activeRequest?.abort()
    const request = new AbortController()
    activeRequest = request
    $error.addClass('d-none').text('')
    $reloadButton.prop('disabled', true).text('Recarregando...')

    try {
      const loadedInvoices = await getInvoices(request.signal)
      const loadedIds = new Set(loadedInvoices.map(({ id }) => id))
      const pendingLocalInvoices: InvoiceDTO[] = []

      loadedIds.forEach((id) => locallyAddedInvoices.delete(id))
      locallyAddedInvoices.forEach((invoice) => {
        pendingLocalInvoices.push(invoice)
      })
      invoices = loadedInvoices.concat(pendingLocalInvoices)
      render()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      const details = error instanceof Error ? error.message : 'Erro desconhecido.'

      $error
        .removeClass('d-none')
        .text(`Não foi possível carregar as notas. ${details}`)
      render()
    } finally {
      if (activeRequest === request) {
        activeRequest = undefined
        $reloadButton.prop('disabled', false).text('Recarregar')
      }
    }
  }

  const searchInvoices = debounce(() => {
    customerNameFilter = $searchInput.val()?.trim() ?? ''
    render()
  }, 300)

  $searchInput.on('input', searchInvoices)
  $sortSelect.on('change', () => {
    sortOrder = $sortSelect.val() === 'desc' ? 'desc' : 'asc'
    render()
  })
  $reloadButton.on('click', () => void loadInvoices())

  void loadInvoices()

  return { addInvoice }
}
