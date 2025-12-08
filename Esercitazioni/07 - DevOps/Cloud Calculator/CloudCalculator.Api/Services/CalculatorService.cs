namespace CloudCalculator.Api.Services;

public class CalculatorService
{
    public double Add(double a, double b) => a + b;

    public double Subtract(double a, double b) => a - b;

    public double Multiply(double a, double b) => a * b;

    public double Divide(double a, double b)
    {
        if (b == 0)
        {
            throw new DivideByZeroException("The divisor 'b' must be different from zero.");
        }

        return a / b;
    }
}
