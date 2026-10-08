using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ComplaintConfiguration : IEntityTypeConfiguration<Complaint>
{
    public void Configure(EntityTypeBuilder<Complaint> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Title).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Description).IsRequired().HasMaxLength(2000);
        builder.Property(c => c.ResolutionNote).HasMaxLength(2000);

        builder.HasOne(c => c.Request)
               .WithMany(r => r.Complaints)
               .HasForeignKey(c => c.RequestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Customer)
               .WithMany()
               .HasForeignKey(c => c.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ResolvedByUser)
               .WithMany()
               .HasForeignKey(c => c.ResolvedByUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.RequestId);
        builder.HasIndex(c => c.CustomerId);
        builder.HasIndex(c => c.Status);

        builder.HasQueryFilter(c => !c.Request!.IsDeleted);
    }
}

