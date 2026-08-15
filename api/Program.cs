using System.Globalization;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<InvoiceDb>(opt => opt.UseInMemoryDatabase("InvoiceList"));
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");

var notas = app.MapGroup("/notas");

notas.MapGet("/", GetAllInvoices);
notas.MapPost("/", CreateInvoice);

app.Run();

static async Task<IResult> GetAllInvoices(InvoiceDb db)
{
    return TypedResults.Ok(await db.Invoices.ToArrayAsync());
}

static async Task<IResult> CreateInvoice(CreateInvoiceDTO createInvoiceDTO, InvoiceDb db)
{
    var validationErrors = ValidateCreateInvoice(createInvoiceDTO);

    if (validationErrors.Count > 0)
    {
        return TypedResults.ValidationProblem(validationErrors);
    }

    var invoice = new Invoice
    {
        InvoiceNumber = createInvoiceDTO.InvoiceNumber!.Trim(),
        CustomerName = createInvoiceDTO.CustomerName!.Trim(),
        Value = createInvoiceDTO.Value!.Value,
        EmissionDate = DateOnly.ParseExact(
            createInvoiceDTO.EmissionDate!,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture),
        CreatedAt = DateTimeOffset.Now
    };

    db.Invoices.Add(invoice);
    await db.SaveChangesAsync();

    return TypedResults.Created($"/invoices/{invoice.Id}", invoice);
}

static Dictionary<string, string[]> ValidateCreateInvoice(CreateInvoiceDTO createInvoiceDTO)
{
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrWhiteSpace(createInvoiceDTO.InvoiceNumber))
    {
        errors["invoiceNumber"] = ["Informe o número da nota."];
    }
    else if (createInvoiceDTO.InvoiceNumber.Trim().Any(character => !char.IsAsciiDigit(character)))
    {
        errors["invoiceNumber"] = ["O número da nota deve conter apenas números."];
    }

    if (string.IsNullOrWhiteSpace(createInvoiceDTO.CustomerName))
    {
        errors["customerName"] = ["Informe o nome do cliente."];
    }

    if (createInvoiceDTO.Value is null)
    {
        errors["value"] = ["Informe o valor da nota."];
    }
    else if (createInvoiceDTO.Value < 0)
    {
        errors["value"] = ["O valor da nota deve ser maior ou igual a zero."];
    }
    else if (HasMoreThanTwoDecimalPlaces(createInvoiceDTO.Value.Value))
    {
        errors["value"] = ["O valor da nota deve ter no máximo duas casas decimais."];
    }

    if (string.IsNullOrWhiteSpace(createInvoiceDTO.EmissionDate))
    {
        errors["emissionDate"] = ["Informe a data de emissão."];
    }
    else if (!DateOnly.TryParseExact(
        createInvoiceDTO.EmissionDate,
        "yyyy-MM-dd",
        CultureInfo.InvariantCulture,
        DateTimeStyles.None,
        out var emissionDate))
    {
        errors["emissionDate"] = ["A data de emissão deve estar no formato AAAA-MM-DD."];
    }
    else if (emissionDate > DateOnly.FromDateTime(DateTime.Today))
    {
        errors["emissionDate"] = ["A data de emissão não pode ser posterior à data atual."];
    }

    return errors;
}

static bool HasMoreThanTwoDecimalPlaces(decimal value)
{
    return decimal.Round(value, 2) != value;
}
