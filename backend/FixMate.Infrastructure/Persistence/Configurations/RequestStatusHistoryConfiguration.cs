using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class RequestStatusHistoryConfiguration : IEntityTypeConfiguration<RequestStatusHistory>
{
    public void Configure(EntityTypeBuilder<RequestStatusHistory> builder)
    {
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Note).HasMaxLength(500);

        builder.HasOne(h => h.Request)
               .WithMany(r => r.StatusHistory)
               .HasForeignKey(h => h.RequestId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.ChangedByUser)
               .WithMany()
               .HasForeignKey(h => h.ChangedByUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => h.RequestId);
        builder.HasIndex(h => h.Timestamp);

        builder.HasQueryFilter(h => !h.Request!.IsDeleted);
    }
}

