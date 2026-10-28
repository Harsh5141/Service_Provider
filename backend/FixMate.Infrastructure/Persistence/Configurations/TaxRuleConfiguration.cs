using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class TaxRuleConfiguration : IEntityTypeConfiguration<TaxRule>
{
    public void Configure(EntityTypeBuilder<TaxRule> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).IsRequired().HasMaxLength(150);
        builder.Property(t => t.Description).HasMaxLength(500);
        builder.Property(t => t.Rate).HasPrecision(18, 2);
        builder.Property(t => t.CgstRate).HasPrecision(5, 2);
        builder.Property(t => t.SgstRate).HasPrecision(5, 2);
        builder.Property(t => t.IgstRate).HasPrecision(5, 2);
        builder.Property(t => t.HsnSacCode).HasMaxLength(20);

        builder.HasOne(t => t.Service)
               .WithMany()
               .HasForeignKey(t => t.ServiceId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Category)
               .WithMany()
               .HasForeignKey(t => t.CategoryId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(t => !t.IsDeleted);

        builder.HasIndex(t => t.IsActive);
        builder.HasIndex(t => t.IsGlobalDefault);
        builder.HasIndex(t => t.ServiceId);
        builder.HasIndex(t => t.CategoryId);
    }
}
