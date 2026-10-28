using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class PlatformSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DataType { get; set; } = "string"; // "decimal", "boolean", "string", "int"
}
