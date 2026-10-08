using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ProviderSkillConfiguration : IEntityTypeConfiguration<ProviderSkill>
{
    public void Configure(EntityTypeBuilder<ProviderSkill> builder)
    {
        builder.HasKey(ps => ps.Id);

        builder.HasOne(ps => ps.ProviderProfile)
               .WithMany(p => p.Skills)
               .HasForeignKey(ps => ps.ProviderProfileId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ps => ps.Service)
               .WithMany(s => s.ProviderSkills)
               .HasForeignKey(ps => ps.ServiceId)
               .IsRequired(false)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ps => new { ps.ProviderProfileId, ps.ServiceId }).IsUnique();
    }
}
