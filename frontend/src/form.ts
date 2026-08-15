import { createInvoice } from './api'
import type { CreateInvoiceDTO } from './create-invoice-dto'
import type { InvoiceDTO } from './invoice-dto'

export function createForm(
  $root: JQuery<HTMLElement>,
  onInvoiceCreated: (invoice: InvoiceDTO) => void,
) {
  $root.html(`
        <div data-form-message class="d-none" role="alert" aria-live="polite"></div>

        <form data-invoice-form novalidate>
            <div class="mb-3">
                <label for="invoice-number" class="form-label">Número da nota</label>
                <input
                    id="invoice-number"
                    data-invoice-number
                    name="invoiceNumber"
                    class="form-control"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="off"
                    required
                />
                <div class="invalid-feedback">Informe o número da nota.</div>
            </div>

            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label for="customer-name" class="form-label">Nome do cliente</label>
                    <input
                        id="customer-name"
                        data-customer-name
                        name="customerName"
                        class="form-control"
                        type="text"
                        autocomplete="name"
                        required
                    />
                    <div class="invalid-feedback">
                        Informe o nome do cliente.
                    </div>
                </div>

                <div class="col-md-6">
                    <label for="invoice-value" class="form-label">Valor</label>
                    <div class="input-group">
                        <span class="input-group-text">R$</span>
                        <input
                            id="invoice-value"
                            data-invoice-value
                            name="value"
                            class="form-control"
                            type="number"
                            min="0"
                            step="0.01"
                            inputmode="decimal"
                            required
                        />
                        <div data-invoice-value-feedback class="invalid-feedback">
                            Informe um valor maior ou igual a zero.
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <label for="emission-date" class="form-label">Data de emissão</label>
                <input
                    id="emission-date"
                    data-emission-date
                    name="emissionDate"
                    class="form-control"
                    type="date"
                    required
                />
                <div data-emission-date-feedback class="invalid-feedback">
                    Informe a data de emissão.
                </div>
            </div>

            <button data-submit-button class="btn btn-primary w-100" type="submit">
                Cadastrar nota
            </button>
        </form>
    `)

  const $form = $root.find<HTMLFormElement>('[data-invoice-form]')
  const $message = $root.find<HTMLElement>('[data-form-message]')
  const $submitButton = $form.find<HTMLButtonElement>('[data-submit-button]')
  const $invoiceNumber = $form.find<HTMLInputElement>('[data-invoice-number]')
  const $customerName = $form.find<HTMLInputElement>('[data-customer-name]')
  const invoiceValue = $form.find<HTMLInputElement>('[data-invoice-value]')[0]
  const invoiceValueFeedback = $form.find<HTMLElement>(
    '[data-invoice-value-feedback]',
  )[0]
  const emissionDate = $form.find<HTMLInputElement>('[data-emission-date]')[0]
  const emissionDateFeedback = $form.find<HTMLElement>(
    '[data-emission-date-feedback]',
  )[0]
  const invoiceNumberInput = $invoiceNumber[0]
  const customerNameInput = $customerName[0]
  const today = new Date()

  emissionDate.max = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const validateInvoiceNumber = () => {
    invoiceNumberInput.setCustomValidity(
      invoiceNumberInput.value.trim() ? '' : 'Informe o número da nota.',
    )
  }

  const validateCustomerName = () => {
    customerNameInput.setCustomValidity(
      customerNameInput.value.trim() ? '' : 'Informe o nome do cliente.',
    )
  }

  const validateInvoiceValue = () => {
    if (invoiceValue.validity.valueMissing) {
      invoiceValueFeedback.textContent = 'Informe o valor da nota.'
    } else if (invoiceValue.validity.badInput) {
      invoiceValueFeedback.textContent = 'Informe um valor válido.'
    } else if (invoiceValue.valueAsNumber < 0) {
      invoiceValueFeedback.textContent =
        'Informe um valor maior ou igual a zero.'
    } else if (invoiceValue.validity.stepMismatch) {
      invoiceValueFeedback.textContent =
        'Informe um valor com no máximo duas casas decimais.'
    }
  }

  const validateEmissionDate = () => {
    emissionDateFeedback.textContent = emissionDate.validity.rangeOverflow
      ? 'A data de emissão não pode ser posterior a hoje.'
      : 'Informe a data de emissão.'
  }

  $invoiceNumber.on('input', () => {
    invoiceNumberInput.value = invoiceNumberInput.value.replace(/\D/g, '')
    validateInvoiceNumber()
  })
  $customerName.on('input', validateCustomerName)
  invoiceValue.addEventListener('input', validateInvoiceValue)
  emissionDate.addEventListener('input', validateEmissionDate)

  const showMessage = (text: string, type: 'success' | 'danger') => {
    $message
      .removeClass('d-none alert-success alert-danger')
      .addClass(`alert alert-${type}`)
      .text(text)
  }

  $form.on('submit', async function (event) {
    const form = this
    event.preventDefault()
    validateInvoiceNumber()
    validateCustomerName()
    validateInvoiceValue()
    validateEmissionDate()

    if (!form.checkValidity()) {
      form.classList.add('was-validated')
      return
    }

    const invoice: CreateInvoiceDTO = {
      customerName: customerNameInput.value.trim(),
      invoiceNumber: $invoiceNumber.val()?.trim() ?? '',
      value: invoiceValue.valueAsNumber,
      emissionDate: emissionDate.value,
    }

    if ($submitButton) {
      $submitButton.prop('disabled', true)
      $submitButton.text('Cadastrando...')
    }

    try {
      const createdInvoice = await createInvoice(invoice)

      $form[0].reset()
      $form[0].classList.remove('was-validated')
      showMessage('Nota cadastrada com sucesso.', 'success')
      onInvoiceCreated(createdInvoice)
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Erro desconhecido.'
      showMessage(`Não foi possível cadastrar a nota. ${details}`, 'danger')
    } finally {
      if ($submitButton) {
        $submitButton.prop('disabled', false)
        $submitButton.text('Cadastrar nota')
      }
    }
  })
}
