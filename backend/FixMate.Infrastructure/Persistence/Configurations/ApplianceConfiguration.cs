using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ApplianceConfiguration : IEntityTypeConfiguration<Appliance>
{
    public void Configure(EntityTypeBuilder<Appliance> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Category).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Brand).IsRequired().HasMaxLength(100);
        builder.Property(a => a.ModelNumber).HasMaxLength(100);
        builder.Property(a => a.SerialNumber).HasMaxLength(100);

        builder.HasOne(a => a.User)
               .WithMany()
               .HasForeignKey(a => a.UserId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(a => !a.IsDeleted);
        builder.HasIndex(a => a.UserId);
    }
}

