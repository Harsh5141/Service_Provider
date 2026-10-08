namespace FixMate.Application.Common;

/// <summary>Base class for paginated query parameters shared across all list endpoints.</summary>
public class PaginationParams
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public int PageNumber { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }

    public string? SortBy    { get; set; }
    public bool    Ascending { get; set; } = false;
    public string? Search    { get; set; }
}
