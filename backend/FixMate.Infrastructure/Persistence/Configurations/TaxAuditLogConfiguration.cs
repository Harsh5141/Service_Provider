using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class TaxAuditLogConfiguration : IEntityTypeConfiguration<TaxAuditLog>
{
    public void Configure(EntityTypeBuilder<TaxAuditLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
        builder.Property(a => a.RuleName).HasMaxLength(150);
        builder.Property(a => a.Details).HasMaxLength(1000);
        builder.Property(a => a.PerformedByName).HasMaxLength(100);

        builder.HasOne(a => a.TaxRule)
               .WithMany(t => t.AuditLogs)
               .HasForeignKey(a => a.TaxRuleId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.TaxRuleId);
        builder.HasIndex(a => a.Timestamp);
    }
}
