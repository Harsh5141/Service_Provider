using FixMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixMate.Infrastructure.Persistence.Configurations;

public class RequestMediaConfiguration : IEntityTypeConfiguration<RequestMedia>
{
    public void Configure(EntityTypeBuilder<RequestMedia> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.MediaUrl).IsRequired().HasMaxLength(500);

        builder.HasOne(m => m.Request)
               .WithMany(r => r.Media)
               .HasForeignKey(m => m.RequestId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.UploadedByUser)
               .WithMany()
               .HasForeignKey(m => m.UploadedByUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.RequestId);

        builder.HasQueryFilter(m => !m.Request!.IsDeleted);
    }
}

