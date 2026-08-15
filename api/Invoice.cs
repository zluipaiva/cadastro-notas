public class Invoice
{
    public int Id { get; set; }
    public required string InvoiceNumber { get; set; }
    public required string CustomerName { get; set; }
    public required decimal Value { get; set; }
    public required DateOnly EmissionDate { get; set; }
    public required DateTimeOffset CreatedAt { get; set; }
}
