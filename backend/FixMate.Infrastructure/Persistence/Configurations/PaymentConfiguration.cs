using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.RazorpayOrderId).IsRequired().HasMaxLength(100);
        builder.Property(p => p.RazorpayPaymentId).HasMaxLength(100);
        builder.Property(p => p.RazorpaySignature).HasMaxLength(256);
        builder.Property(p => p.FailureReason).HasMaxLength(500);

        builder.Property(p => p.Amount).HasPrecision(18, 2);
        builder.Property(p => p.PlatformFee).HasPrecision(18, 2);
        builder.Property(p => p.ProviderPayout).HasPrecision(18, 2);

        builder.Property(p => p.RowVersion).IsRowVersion();

        builder.HasOne(p => p.Request)
               .WithOne(r => r.Payment)
               .HasForeignKey<Payment>(p => p.RequestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.RequestId).IsUnique();
        builder.HasIndex(p => p.RazorpayOrderId).IsUnique();
        builder.HasIndex(p => p.Status);

        builder.HasQueryFilter(p => !p.Request!.IsDeleted);
    }
}

