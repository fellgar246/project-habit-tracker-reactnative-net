using HabitTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HabitTracker.Infrastructure.Data.Configurations;

public class HabitConfiguration : IEntityTypeConfiguration<Habit>
{
    public void Configure(EntityTypeBuilder<Habit> builder)
    {
        builder.HasKey(h => h.Id);

        builder.Property(h => h.Name)
            .IsRequired()
            .HasMaxLength(60);

        builder.Property(h => h.Description)
            .HasMaxLength(250);

        builder.Property(h => h.Icon)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(h => h.Color)
            .IsRequired()
            .HasMaxLength(7);

        builder.Property(h => h.ScheduleType)
            .IsRequired();

        builder.Property(h => h.IsArchived)
            .HasDefaultValue(false);

        builder.Property(h => h.CreatedAt)
            .IsRequired();

        builder.HasMany(h => h.Logs)
            .WithOne(l => l.Habit)
            .HasForeignKey(l => l.HabitId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
