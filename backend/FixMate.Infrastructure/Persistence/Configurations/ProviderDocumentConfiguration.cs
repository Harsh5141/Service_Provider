using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class ProviderDocumentConfiguration : IEntityTypeConfiguration<ProviderDocument>
{
    public void Configure(EntityTypeBuilder<ProviderDocument> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.DocumentUrl).IsRequired().HasMaxLength(500);
        builder.Property(d => d.DocumentNumber).HasMaxLength(100);
        builder.Property(d => d.RejectionReason).HasMaxLength(200);

        builder.HasOne(d => d.ProviderProfile)
               .WithMany(p => p.Documents)
               .HasForeignKey(d => d.ProviderProfileId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.ProviderProfileId);
    }
}

