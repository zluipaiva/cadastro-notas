import 'bootstrap/dist/css/bootstrap.min.css'
import $ from 'jquery'
import './style.css'
import { createForm } from './form'
import { createInvoiceTable } from './invoice-table'

$(() => {
  $('#app').html(`
    <main class="container py-5">
      <section class="invoice-card card border-0 shadow-sm mx-auto">
        <div class="card-body p-4 p-md-5">
          <h1 class="display-6 fw-semibold mb-4">Cadastro de Notas</h1>

          <div data-component="form"></div>

          <hr class="my-5" />

          <div data-component="invoice-table"></div>
        </div>
      </section>
    </main>
  `)

  const invoiceTable = createInvoiceTable(
    $('#app').find('[data-component="invoice-table"]'),
  )

  createForm(
    $('#app').find('[data-component="form"]'),
    invoiceTable.addInvoice,
  )
})
