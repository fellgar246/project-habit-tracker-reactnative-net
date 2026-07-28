using HabitTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HabitTracker.Infrastructure.Data.Configurations;

public class HabitLogConfiguration : IEntityTypeConfiguration<HabitLog>
{
    public void Configure(EntityTypeBuilder<HabitLog> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Date)
            .IsRequired();

        builder.Property(l => l.CompletedAt)
            .IsRequired();

        builder.HasIndex(l => new { l.HabitId, l.Date })
            .IsUnique();
    }
}
