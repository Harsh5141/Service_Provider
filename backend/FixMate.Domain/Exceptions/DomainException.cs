namespace FixMate.Domain.Exceptions;

/// <summary>
/// Thrown for business rule violations (e.g., cancelling a completed request).
/// Maps to HTTP 400 in the global exception handler.
/// </summary>
public class DomainException(string message) : Exception(message);
