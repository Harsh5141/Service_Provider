using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Comment).HasMaxLength(1000);

        builder.HasOne(r => r.Request)
               .WithOne(req => req.Review)
               .HasForeignKey<Review>(r => r.RequestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Customer)
               .WithMany()
               .HasForeignKey(r => r.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ProviderProfile)
               .WithMany(p => p.Reviews)
               .HasForeignKey(r => r.ProviderProfileId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(r => !r.IsDeleted);

        builder.HasIndex(r => r.RequestId).IsUnique();
        builder.HasIndex(r => r.ProviderProfileId);
        builder.HasIndex(r => r.CustomerId);
    }
}

