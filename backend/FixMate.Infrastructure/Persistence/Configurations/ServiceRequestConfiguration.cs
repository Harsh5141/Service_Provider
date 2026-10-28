using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ServiceRequestConfiguration : IEntityTypeConfiguration<ServiceRequest>
{
    public void Configure(EntityTypeBuilder<ServiceRequest> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.TrackingNumber).IsRequired().HasMaxLength(36);
        builder.Property(r => r.TimeSlot).IsRequired().HasMaxLength(50);
        builder.Property(r => r.ProblemDescription).IsRequired().HasMaxLength(2000);
        builder.Property(r => r.CancellationReason).HasMaxLength(500);

        builder.Property(r => r.BaseAmount).HasPrecision(18, 2);
        builder.Property(r => r.ExtraCharges).HasPrecision(18, 2);
        builder.Property(r => r.DiscountAmount).HasPrecision(18, 2);
        builder.Property(r => r.TotalAmount).HasPrecision(18, 2);
        builder.Property(r => r.PlatformFee).HasPrecision(18, 2);
        builder.Property(r => r.ServiceChargeRate).HasPrecision(5, 4);
        builder.Property(r => r.CommissionRate).HasPrecision(5, 4);
        builder.Property(r => r.CommissionAmount).HasPrecision(18, 2);
        builder.Property(r => r.ProviderEarnings).HasPrecision(18, 2);
        builder.Property(r => r.PayoutStatus).HasMaxLength(50);
        builder.Property(r => r.DistanceKm).HasPrecision(9, 2);

        // Tax Snapshot Configuration
        builder.Property(r => r.TaxRuleName).HasMaxLength(150);
        builder.Property(r => r.TaxRate).HasPrecision(18, 2);
        builder.Property(r => r.TaxableBase).HasPrecision(18, 2);
        builder.Property(r => r.TaxAmount).HasPrecision(18, 2);
        builder.Property(r => r.CgstRate).HasPrecision(5, 2);
        builder.Property(r => r.CgstAmount).HasPrecision(18, 2);
        builder.Property(r => r.SgstRate).HasPrecision(5, 2);
        builder.Property(r => r.SgstAmount).HasPrecision(18, 2);
        builder.Property(r => r.IgstRate).HasPrecision(5, 2);
        builder.Property(r => r.IgstAmount).HasPrecision(18, 2);
        builder.Property(r => r.HsnSacCode).HasMaxLength(20);
        builder.Property(r => r.PlaceOfSupply).HasMaxLength(100);
        builder.Property(r => r.SupplierGstin).HasMaxLength(20);
        builder.Property(r => r.InvoiceNumber).HasMaxLength(50);

        builder.Property(r => r.RowVersion).IsRowVersion();

        builder.HasOne(r => r.Customer)
               .WithMany()
               .HasForeignKey(r => r.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ProviderProfile)
               .WithMany(p => p.AssignedRequests)
               .HasForeignKey(r => r.ProviderProfileId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Service)
               .WithMany(s => s.ServiceRequests)
               .HasForeignKey(r => r.ServiceId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Address)
               .WithMany()
               .HasForeignKey(r => r.AddressId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(r => !r.IsDeleted);

        builder.HasIndex(r => r.TrackingNumber).IsUnique();
        builder.HasIndex(r => r.CustomerId);
        builder.HasIndex(r => r.ProviderProfileId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.ScheduledDate);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
    }
}

