using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.RazorpayRefundId).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Amount).HasPrecision(18, 2);
        builder.Property(r => r.Reason).IsRequired().HasMaxLength(500);
        builder.Property(r => r.Status).IsRequired().HasMaxLength(50);

        builder.HasOne(r => r.Payment)
               .WithMany(p => p.Refunds)
               .HasForeignKey(r => r.PaymentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.RazorpayRefundId).IsUnique();
        builder.HasIndex(r => r.PaymentId);

        builder.HasQueryFilter(r => !r.Payment!.Request!.IsDeleted);
    }
}

