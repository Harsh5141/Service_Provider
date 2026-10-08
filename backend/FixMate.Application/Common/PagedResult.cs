namespace FixMate.Application.Common;

/// <summary>Paginated list wrapper returned by all list endpoints.</summary>
public sealed class PagedResult<T>
{
    public IEnumerable<T> Items      { get; init; } = [];
    public int            TotalCount { get; init; }
    public int            PageNumber { get; init; }
    public int            PageSize   { get; init; }
    public int            TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool           HasNext    => PageNumber < TotalPages;
    public bool           HasPrevious => PageNumber > 1;
}
