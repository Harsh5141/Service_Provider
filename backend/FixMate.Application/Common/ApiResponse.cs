namespace FixMate.Application.Common;

/// <summary>
/// Standard API response envelope used by every endpoint.
/// Keeps the response shape consistent for the frontend regardless of success or failure.
/// </summary>
/// <typeparam name="T">The payload type.</typeparam>
public sealed class ApiResponse<T>
{
    public bool   Success    { get; init; }
    public int    StatusCode { get; init; }
    public string Message    { get; init; } = string.Empty;
    public T?     Data       { get; init; }
    public IEnumerable<string> Errors { get; init; } = [];

    public static ApiResponse<T> Ok(T data, string message = "Success", int statusCode = 200)
        => new() { Success = true, StatusCode = statusCode, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message, int statusCode = 400, IEnumerable<string>? errors = null)
        => new() { Success = false, StatusCode = statusCode, Message = message, Errors = errors ?? [] };
}
