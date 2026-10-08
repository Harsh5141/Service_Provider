using FixMate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace FixMate.API.Extensions;

public static class DatabaseExtensions
{
    /// <summary>
    /// Applies pending EF Core migrations and runs the data seeder.
    /// Ensures all required database tables exist before running seeding.
    /// </summary>
    public static async Task InitialiseDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        try
        {
            await EnsureSchemaAndMigrationsAsync(db);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Schema initialization warning: {Message}", ex.Message);
        }

        try
        {
            var seeder = scope.ServiceProvider.GetRequiredService<AppDbSeeder>();
            await seeder.SeedAsync();
            Log.Information("FixMate database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Database seeding warning: {Message}", ex.Message);
        }
    }

    private static async Task EnsureSchemaAndMigrationsAsync(AppDbContext db)
    {
        // 1. Ensure __EFMigrationsHistory table exists
        await db.Database.ExecuteSqlRawAsync(
            @"IF OBJECT_ID(N'[__EFMigrationsHistory]', N'U') IS NULL
              CREATE TABLE [__EFMigrationsHistory] (
                  [MigrationId] nvarchar(150) NOT NULL PRIMARY KEY,
                  [ProductVersion] nvarchar(32) NOT NULL
              );");

        // 2. Ensure each domain table exists if not already present
        var tableCreationSql = @"
IF OBJECT_ID(N'[dbo].[AuditLogs]', N'U') IS NULL
CREATE TABLE [dbo].[AuditLogs] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [EntityName] nvarchar(100) NOT NULL,
    [EntityId] int NOT NULL,
    [Action] nvarchar(50) NOT NULL,
    [ChangesJson] nvarchar(max) NOT NULL,
    [PerformedByUserId] int NULL,
    [Timestamp] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL
);

IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NULL
CREATE TABLE [dbo].[Users] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [Name] nvarchar(100) NOT NULL,
    [Email] nvarchar(200) NOT NULL,
    [Phone] nvarchar(20) NOT NULL,
    [PasswordHash] nvarchar(256) NOT NULL,
    [Role] int NOT NULL,
    [AvatarUrl] nvarchar(500) NULL,
    [IsActive] bit NOT NULL,
    [RefreshToken] nvarchar(256) NULL,
    [RefreshTokenExpiresAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL DEFAULT 0,
    [DeletedAt] datetime2 NULL
);

IF OBJECT_ID(N'[dbo].[Addresses]', N'U') IS NULL
CREATE TABLE [dbo].[Addresses] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [UserId] int NOT NULL,
    [Label] nvarchar(50) NOT NULL,
    [Street] nvarchar(200) NOT NULL,
    [City] nvarchar(100) NOT NULL,
    [State] nvarchar(100) NOT NULL,
    [PostalCode] nvarchar(20) NOT NULL,
    [Latitude] decimal(9,6) NULL,
    [Longitude] decimal(9,6) NULL,
    [IsDefault] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL DEFAULT 0,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [FK_Addresses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

IF OBJECT_ID(N'[dbo].[ProviderProfiles]', N'U') IS NULL
CREATE TABLE [dbo].[ProviderProfiles] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [UserId] int NOT NULL,
    [Bio] nvarchar(1000) NOT NULL,
    [ExperienceYears] int NOT NULL,
    [RatingAverage] decimal(3,2) NOT NULL,
    [RatingCount] int NOT NULL,
    [Status] int NOT NULL,
    [IsAvailable] bit NOT NULL,
    [ServiceRadiusKm] int NOT NULL DEFAULT 15,
    [CommissionRate] decimal(5,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL DEFAULT 0,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [FK_ProviderProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

IF OBJECT_ID(N'[dbo].[ProviderSkills]', N'U') IS NULL
CREATE TABLE [dbo].[ProviderSkills] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [ProviderProfileId] int NOT NULL,
    [ServiceId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_ProviderSkills_ProviderProfiles_ProviderProfileId] FOREIGN KEY ([ProviderProfileId]) REFERENCES [ProviderProfiles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProviderSkills_Services_ServiceId] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE CASCADE
);

IF OBJECT_ID(N'[dbo].[ProviderDocuments]', N'U') IS NULL
CREATE TABLE [dbo].[ProviderDocuments] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [ProviderProfileId] int NOT NULL,
    [DocumentType] int NOT NULL,
    [DocumentUrl] nvarchar(500) NOT NULL,
    [IsVerified] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_ProviderDocuments_ProviderProfiles_ProviderProfileId] FOREIGN KEY ([ProviderProfileId]) REFERENCES [ProviderProfiles] ([Id]) ON DELETE CASCADE
);

IF OBJECT_ID(N'[dbo].[ServiceCategories]', N'U') IS NULL
CREATE TABLE [dbo].[ServiceCategories] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [Name] nvarchar(100) NOT NULL,
    [Slug] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NOT NULL,
    [IconName] nvarchar(100) NULL,
    [ImageUrl] nvarchar(500) NULL,
    [DisplayOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL DEFAULT 0,
    [DeletedAt] datetime2 NULL
);

IF OBJECT_ID(N'[dbo].[Services]', N'U') IS NULL
CREATE TABLE [dbo].[Services] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [CategoryId] int NOT NULL,
    [Name] nvarchar(150) NOT NULL,
    [Description] nvarchar(1000) NOT NULL,
    [BasePrice] decimal(18,2) NOT NULL,
    [EstimatedDurationMinutes] int NOT NULL,
    [IsActive] bit NOT NULL,
    [ImageUrl] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL DEFAULT 0,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [FK_Services_ServiceCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [ServiceCategories] ([Id]) ON DELETE CASCADE
);

IF OBJECT_ID(N'[dbo].[Appliances]', N'U') IS NULL
CREATE TABLE [dbo].[Appliances] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [CustomerId] int NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Brand] nvarchar(100) NOT NULL,
    [ModelNumber] nvarchar(100) NULL,
    [PurchaseDate] datetime2 NULL,
    [WarrantyExpiryDate] datetime2 NULL,
    [Notes] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL DEFAULT 0,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [FK_Appliances_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

IF OBJECT_ID(N'[dbo].[ServiceRequests]', N'U') IS NULL
CREATE TABLE [dbo].[ServiceRequests] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [CustomerId] int NOT NULL,
    [ProviderId] int NULL,
    [ServiceId] int NOT NULL,
    [AddressId] int NULL,
    [ApplianceId] int NULL,
    [Status] int NOT NULL,
    [ScheduledDate] datetime2 NOT NULL,
    [PreferredTimeSlot] nvarchar(50) NOT NULL,
    [ProblemDescription] nvarchar(2000) NOT NULL,
    [AdminNotes] nvarchar(1000) NULL,
    [EstimatedCost] decimal(18,2) NOT NULL,
    [FinalCost] decimal(18,2) NULL,
    [CancellationReason] nvarchar(500) NULL,
    [RowVersion] rowversion NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL DEFAULT 0,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [FK_ServiceRequests_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ServiceRequests_Users_ProviderId] FOREIGN KEY ([ProviderId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ServiceRequests_Services_ServiceId] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ServiceRequests_Addresses_AddressId] FOREIGN KEY ([AddressId]) REFERENCES [Addresses] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ServiceRequests_Appliances_ApplianceId] FOREIGN KEY ([ApplianceId]) REFERENCES [Appliances] ([Id]) ON DELETE NO ACTION
);

IF OBJECT_ID(N'[dbo].[RequestMedia]', N'U') IS NULL
CREATE TABLE [dbo].[RequestMedia] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [RequestId] int NOT NULL,
    [MediaUrl] nvarchar(500) NOT NULL,
    [MediaType] int NOT NULL,
    [UploadedByUserId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_RequestMedia_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_RequestMedia_Users_UploadedByUserId] FOREIGN KEY ([UploadedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

IF OBJECT_ID(N'[dbo].[RequestStatusHistory]', N'U') IS NULL
CREATE TABLE [dbo].[RequestStatusHistory] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [RequestId] int NOT NULL,
    [Status] int NOT NULL,
    [ChangedByUserId] int NOT NULL,
    [Note] nvarchar(500) NULL,
    [Timestamp] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_RequestStatusHistory_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_RequestStatusHistory_Users_ChangedByUserId] FOREIGN KEY ([ChangedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

IF OBJECT_ID(N'[dbo].[Payments]', N'U') IS NULL
CREATE TABLE [dbo].[Payments] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [RequestId] int NOT NULL,
    [RazorpayOrderId] nvarchar(100) NOT NULL,
    [RazorpayPaymentId] nvarchar(100) NULL,
    [RazorpaySignature] nvarchar(256) NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PlatformFee] decimal(18,2) NOT NULL,
    [ProviderPayout] decimal(18,2) NOT NULL,
    [Method] int NOT NULL,
    [Status] int NOT NULL,
    [PaidAt] datetime2 NULL,
    [FailureReason] nvarchar(500) NULL,
    [RowVersion] rowversion NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_Payments_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE NO ACTION
);

IF OBJECT_ID(N'[dbo].[Refunds]', N'U') IS NULL
CREATE TABLE [dbo].[Refunds] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [PaymentId] int NOT NULL,
    [RazorpayRefundId] nvarchar(100) NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Reason] nvarchar(500) NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_Refunds_Payments_PaymentId] FOREIGN KEY ([PaymentId]) REFERENCES [Payments] ([Id]) ON DELETE NO ACTION
);

IF OBJECT_ID(N'[dbo].[Reviews]', N'U') IS NULL
CREATE TABLE [dbo].[Reviews] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [RequestId] int NOT NULL,
    [CustomerId] int NOT NULL,
    [ProviderId] int NOT NULL,
    [Rating] int NOT NULL,
    [Comment] nvarchar(1000) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_Reviews_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Reviews_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Reviews_Users_ProviderId] FOREIGN KEY ([ProviderId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

IF OBJECT_ID(N'[dbo].[Complaints]', N'U') IS NULL
CREATE TABLE [dbo].[Complaints] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [RequestId] int NOT NULL,
    [CustomerId] int NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Description] nvarchar(2000) NOT NULL,
    [Status] int NOT NULL,
    [ResolutionNote] nvarchar(2000) NULL,
    [ResolvedByUserId] int NULL,
    [ResolvedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_Complaints_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Complaints_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Complaints_Users_ResolvedByUserId] FOREIGN KEY ([ResolvedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

IF OBJECT_ID(N'[dbo].[Notifications]', N'U') IS NULL
CREATE TABLE [dbo].[Notifications] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [UserId] int NOT NULL,
    [Type] int NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Message] nvarchar(1000) NOT NULL,
    [RelatedEntityId] int NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

IF OBJECT_ID(N'[dbo].[ServiceHistory]', N'U') IS NULL
CREATE TABLE [dbo].[ServiceHistory] (
    [Id] int NOT NULL IDENTITY PRIMARY KEY,
    [ApplianceId] int NOT NULL,
    [ServiceRequestId] int NULL,
    [ServiceDate] datetime2 NOT NULL,
    [ServiceDone] nvarchar(500) NOT NULL,
    [AmountPaid] decimal(18,2) NOT NULL,
    [ProviderName] nvarchar(100) NULL,
    [Notes] nvarchar(1000) NULL,
    [NextServiceRecommendedDate] datetime2 NULL,
    [ReminderSent] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [FK_ServiceHistory_Appliances_ApplianceId] FOREIGN KEY ([ApplianceId]) REFERENCES [Appliances] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ServiceHistory_ServiceRequests_ServiceRequestId] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE SET NULL
);
";
        await db.Database.ExecuteSqlRawAsync(tableCreationSql);

        // Ensure default constraints exist on all soft-deletable tables
        var defaultConstraintSql = @"
IF OBJECT_ID(N'[dbo].[DF_ProviderProfiles_IsDeleted]', N'D') IS NULL
    ALTER TABLE [dbo].[ProviderProfiles] ADD CONSTRAINT [DF_ProviderProfiles_IsDeleted] DEFAULT 0 FOR [IsDeleted];
IF OBJECT_ID(N'[dbo].[DF_ServiceCategories_IsDeleted]', N'D') IS NULL
    ALTER TABLE [dbo].[ServiceCategories] ADD CONSTRAINT [DF_ServiceCategories_IsDeleted] DEFAULT 0 FOR [IsDeleted];
IF OBJECT_ID(N'[dbo].[DF_Services_IsDeleted]', N'D') IS NULL
    ALTER TABLE [dbo].[Services] ADD CONSTRAINT [DF_Services_IsDeleted] DEFAULT 0 FOR [IsDeleted];
IF OBJECT_ID(N'[dbo].[DF_ServiceRequests_IsDeleted]', N'D') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD CONSTRAINT [DF_ServiceRequests_IsDeleted] DEFAULT 0 FOR [IsDeleted];
IF OBJECT_ID(N'[dbo].[DF_Appliances_IsDeleted]', N'D') IS NULL
    ALTER TABLE [dbo].[Appliances] ADD CONSTRAINT [DF_Appliances_IsDeleted] DEFAULT 0 FOR [IsDeleted];
IF OBJECT_ID(N'[dbo].[DF_Addresses_IsDeleted]', N'D') IS NULL
    ALTER TABLE [dbo].[Addresses] ADD CONSTRAINT [DF_Addresses_IsDeleted] DEFAULT 0 FOR [IsDeleted];
IF OBJECT_ID(N'[dbo].[DF_Users_IsDeleted]', N'D') IS NULL
    ALTER TABLE [dbo].[Users] ADD CONSTRAINT [DF_Users_IsDeleted] DEFAULT 0 FOR [IsDeleted];
";
        await db.Database.ExecuteSqlRawAsync(defaultConstraintSql);

        // Ensure all table columns match EF Core domain models
        var columnSyncSql = @"
-- ServiceRequests column alignment & legacy nullable fixes
IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'PreferredTimeSlot') IS NOT NULL
    ALTER TABLE [dbo].[ServiceRequests] ALTER COLUMN [PreferredTimeSlot] nvarchar(50) NULL;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'EstimatedCost') IS NOT NULL
    ALTER TABLE [dbo].[ServiceRequests] ALTER COLUMN [EstimatedCost] decimal(18,2) NULL;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'ProviderId') IS NOT NULL
    ALTER TABLE [dbo].[ServiceRequests] ALTER COLUMN [ProviderId] int NULL;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'TrackingNumber') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [TrackingNumber] nvarchar(36) NOT NULL DEFAULT NEWID();

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'ProviderProfileId') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [ProviderProfileId] int NULL;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'TimeSlot') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [TimeSlot] nvarchar(50) NOT NULL DEFAULT N'10:00 AM - 12:00 PM';

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'BaseAmount') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [BaseAmount] decimal(18,2) NOT NULL DEFAULT 0.00;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'ExtraCharges') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [ExtraCharges] decimal(18,2) NOT NULL DEFAULT 0.00;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'DiscountAmount') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [DiscountAmount] decimal(18,2) NOT NULL DEFAULT 0.00;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'TotalAmount') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [TotalAmount] decimal(18,2) NOT NULL DEFAULT 0.00;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'AssignedAt') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [AssignedAt] datetime2 NULL;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'DistanceKm') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [DistanceKm] decimal(9,2) NULL;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'CancelledAt') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [CancelledAt] datetime2 NULL;

IF COL_LENGTH(N'[dbo].[ServiceRequests]', N'CancelledByUserId') IS NULL
    ALTER TABLE [dbo].[ServiceRequests] ADD [CancelledByUserId] int NULL;

-- ProviderProfiles column alignment
IF COL_LENGTH(N'[dbo].[ProviderProfiles]', N'ServiceRadiusKm') IS NULL
    ALTER TABLE [dbo].[ProviderProfiles] ADD [ServiceRadiusKm] int NOT NULL DEFAULT 15;

-- Reviews column alignment
IF COL_LENGTH(N'[dbo].[Reviews]', N'ProviderProfileId') IS NULL
    ALTER TABLE [dbo].[Reviews] ADD [ProviderProfileId] int NOT NULL DEFAULT 1;

IF COL_LENGTH(N'[dbo].[Reviews]', N'IsVisible') IS NULL
    ALTER TABLE [dbo].[Reviews] ADD [IsVisible] bit NOT NULL DEFAULT 1;

IF COL_LENGTH(N'[dbo].[Reviews]', N'IsDeleted') IS NULL
    ALTER TABLE [dbo].[Reviews] ADD [IsDeleted] bit NOT NULL DEFAULT 0;

IF COL_LENGTH(N'[dbo].[Reviews]', N'DeletedAt') IS NULL
    ALTER TABLE [dbo].[Reviews] ADD [DeletedAt] datetime2 NULL;

-- ProviderDocuments column alignment
IF COL_LENGTH(N'[dbo].[ProviderDocuments]', N'DocumentNumber') IS NULL
    ALTER TABLE [dbo].[ProviderDocuments] ADD [DocumentNumber] nvarchar(100) NULL;

IF COL_LENGTH(N'[dbo].[ProviderDocuments]', N'RejectionReason') IS NULL
    ALTER TABLE [dbo].[ProviderDocuments] ADD [RejectionReason] nvarchar(500) NULL;

IF COL_LENGTH(N'[dbo].[ProviderDocuments]', N'VerifiedAt') IS NULL
    ALTER TABLE [dbo].[ProviderDocuments] ADD [VerifiedAt] datetime2 NULL;
";
        await db.Database.ExecuteSqlRawAsync(columnSyncSql);

        // 3. Mark the migration as applied in __EFMigrationsHistory
        await db.Database.ExecuteSqlRawAsync(
            @"IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260930092240_InitialSchema')
              INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260930092240_InitialSchema', '9.0.0');");
    }
}
