using Microsoft.EntityFrameworkCore;

class InvoiceDb : DbContext
{
    public InvoiceDb(DbContextOptions<InvoiceDb> options)
        : base(options) { }

    public DbSet<Invoice> Invoices => Set<Invoice>();
}