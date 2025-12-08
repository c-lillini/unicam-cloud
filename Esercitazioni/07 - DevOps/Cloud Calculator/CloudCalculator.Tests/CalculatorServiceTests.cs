using CloudCalculator.Api.Services;
using Xunit;

namespace CloudCalculator.Tests;

public class CalculatorServiceTests
{
    private readonly CalculatorService _calculator = new();

    [Theory]
    [InlineData(1, 2, 3)]
    [InlineData(-5, 5, 0)]
    [InlineData(10.5, 4.5, 15)]
    public void Add_returns_expected_result(double a, double b, double expected)
    {
        var result = _calculator.Add(a, b);

        Assert.Equal(expected, result, precision: 6);
    }

    [Theory]
    [InlineData(5, 2, 3)]
    [InlineData(2, 5, -3)]
    [InlineData(10.5, 0.5, 10)]
    public void Subtract_returns_expected_result(double a, double b, double expected)
    {
        var result = _calculator.Subtract(a, b);

        Assert.Equal(expected, result, precision: 6);
    }

    [Theory]
    [InlineData(2, 3, 6)]
    [InlineData(-4, 3, -12)]
    [InlineData(1.5, 2, 3)]
    public void Multiply_returns_expected_result(double a, double b, double expected)
    {
        var result = _calculator.Multiply(a, b);

        Assert.Equal(expected, result, precision: 6);
    }

    [Theory]
    [InlineData(10, 2, 5)]
    [InlineData(-9, 3, -3)]
    [InlineData(5.5, 2.2, 2.5)]
    public void Divide_returns_expected_result(double a, double b, double expected)
    {
        var result = _calculator.Divide(a, b);

        Assert.Equal(expected, result, precision: 6);
    }

    [Fact]
    public void Divide_by_zero_throws()
    {
        Assert.Throws<DivideByZeroException>(() => _calculator.Divide(10, 0));
    }
}
