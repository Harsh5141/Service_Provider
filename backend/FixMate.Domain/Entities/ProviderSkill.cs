using FixMate.Domain.Common;

namespace FixMate.Domain.Entities;

public class ProviderSkill : BaseEntity
{
    public int ProviderProfileId { get; set; }
    public ProviderProfile? ProviderProfile { get; set; }

    public int ServiceId { get; set; }
    public Service? Service { get; set; }
}
