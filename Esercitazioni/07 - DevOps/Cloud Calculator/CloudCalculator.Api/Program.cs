using CloudCalculator.Api.Services;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<CalculatorService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

var calculator = app.MapGroup("/api/calculator").WithTags("Calculator");

calculator.MapGet("/add", (double a, double b, CalculatorService calculator) =>
        Results.Ok(new CalculationResult(calculator.Add(a, b))))
    .WithName("Add");

calculator.MapGet("/subtract", (double a, double b, CalculatorService calculator) =>
        Results.Ok(new CalculationResult(calculator.Subtract(a, b))))
    .WithName("Subtract");

calculator.MapGet("/multiply", (double a, double b, CalculatorService calculator) =>
        Results.Ok(new CalculationResult(calculator.Multiply(a, b))))
    .WithName("Multiply");

calculator.MapGet("/divide", (double a, double b, CalculatorService calculator) =>
    {
        if (b == 0)
        {
            return Results.BadRequest(new ProblemDetails
            {
                Title = "Division by zero",
                Detail = "The divisor 'b' must be different from zero."
            });
        }

        return Results.Ok(new CalculationResult(calculator.Divide(a, b)));
    })
    .WithName("Divide");

app.Run();

public record CalculationResult(double Result);

public partial class Program;
