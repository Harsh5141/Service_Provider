using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ProviderProfileConfiguration : IEntityTypeConfiguration<ProviderProfile>
{
    public void Configure(EntityTypeBuilder<ProviderProfile> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Bio).HasMaxLength(1000);
        builder.Property(p => p.RatingAverage).HasPrecision(3, 2);
        builder.Property(p => p.CommissionRate).HasPrecision(18, 2);

        builder.HasOne(p => p.User)
               .WithOne()
               .HasForeignKey<ProviderProfile>(p => p.UserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.UserId).IsUnique();
        builder.HasIndex(p => p.Status);
    }
}

