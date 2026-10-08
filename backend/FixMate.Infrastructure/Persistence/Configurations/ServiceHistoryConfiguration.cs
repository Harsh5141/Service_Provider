using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ServiceHistoryConfiguration : IEntityTypeConfiguration<ServiceHistory>
{
    public void Configure(EntityTypeBuilder<ServiceHistory> builder)
    {
        builder.HasKey(h => h.Id);
        builder.Property(h => h.ServiceDone).IsRequired().HasMaxLength(500);
        builder.Property(h => h.AmountPaid).HasPrecision(18, 2);
        builder.Property(h => h.ProviderName).HasMaxLength(100);
        builder.Property(h => h.Notes).HasMaxLength(1000);

        builder.HasOne(h => h.Appliance)
               .WithMany(a => a.ServiceRecords)
               .HasForeignKey(h => h.ApplianceId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.ServiceRequest)
               .WithOne()
               .HasForeignKey<ServiceHistory>(h => h.ServiceRequestId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(h => h.ApplianceId);
        builder.HasIndex(h => h.NextServiceRecommendedDate);
        builder.HasIndex(h => new { h.ReminderSent, h.NextServiceRecommendedDate });

        builder.HasQueryFilter(h => !h.Appliance!.IsDeleted);
    }
}

