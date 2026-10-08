IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] int NOT NULL IDENTITY,
        [EntityName] nvarchar(100) NOT NULL,
        [EntityId] int NOT NULL,
        [Action] nvarchar(50) NOT NULL,
        [ChangesJson] nvarchar(max) NOT NULL,
        [PerformedByUserId] int NULL,
        [Timestamp] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [ServiceCategories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Slug] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [IconName] nvarchar(100) NULL,
        [ImageUrl] nvarchar(500) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_ServiceCategories] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
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
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Services] (
        [Id] int NOT NULL IDENTITY,
        [CategoryId] int NOT NULL,
        [Name] nvarchar(150) NOT NULL,
        [Description] nvarchar(1000) NOT NULL,
        [BasePrice] decimal(18,2) NOT NULL,
        [EstimatedDurationMinutes] int NOT NULL,
        [IsActive] bit NOT NULL,
        [ImageUrl] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Services] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Services_ServiceCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [ServiceCategories] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Addresses] (
        [Id] int NOT NULL IDENTITY,
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
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Addresses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Addresses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Appliances] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Category] nvarchar(100) NOT NULL,
        [Brand] nvarchar(100) NOT NULL,
        [ModelNumber] nvarchar(100) NULL,
        [SerialNumber] nvarchar(100) NULL,
        [PurchaseDate] datetime2 NULL,
        [WarrantyExpiryDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Appliances] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Appliances_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Message] nvarchar(1000) NOT NULL,
        [Type] int NOT NULL,
        [TargetUrl] nvarchar(200) NULL,
        [IsRead] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [ProviderProfiles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Bio] nvarchar(1000) NOT NULL,
        [ExperienceYears] int NOT NULL,
        [RatingAverage] decimal(3,2) NOT NULL,
        [RatingCount] int NOT NULL,
        [Status] int NOT NULL,
        [IsAvailable] bit NOT NULL,
        [CommissionRate] decimal(18,2) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ProviderProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProviderProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [ProviderDocuments] (
        [Id] int NOT NULL IDENTITY,
        [ProviderProfileId] int NOT NULL,
        [DocumentType] int NOT NULL,
        [DocumentUrl] nvarchar(500) NOT NULL,
        [DocumentNumber] nvarchar(100) NULL,
        [IsVerified] bit NOT NULL,
        [RejectionReason] nvarchar(200) NULL,
        [VerifiedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ProviderDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProviderDocuments_ProviderProfiles_ProviderProfileId] FOREIGN KEY ([ProviderProfileId]) REFERENCES [ProviderProfiles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [ServiceRequests] (
        [Id] int NOT NULL IDENTITY,
        [TrackingNumber] nvarchar(36) NOT NULL,
        [CustomerId] int NOT NULL,
        [ProviderProfileId] int NULL,
        [ServiceId] int NOT NULL,
        [AddressId] int NOT NULL,
        [Status] int NOT NULL,
        [ScheduledDate] datetime2 NOT NULL,
        [TimeSlot] nvarchar(50) NOT NULL,
        [ProblemDescription] nvarchar(2000) NOT NULL,
        [BaseAmount] decimal(18,2) NOT NULL,
        [ExtraCharges] decimal(18,2) NOT NULL,
        [DiscountAmount] decimal(18,2) NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [CancellationReason] nvarchar(500) NULL,
        [CancelledAt] datetime2 NULL,
        [CancelledByUserId] int NULL,
        [RowVersion] rowversion NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_ServiceRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ServiceRequests_Addresses_AddressId] FOREIGN KEY ([AddressId]) REFERENCES [Addresses] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ServiceRequests_ProviderProfiles_ProviderProfileId] FOREIGN KEY ([ProviderProfileId]) REFERENCES [ProviderProfiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ServiceRequests_Services_ServiceId] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ServiceRequests_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Complaints] (
        [Id] int NOT NULL IDENTITY,
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
        CONSTRAINT [PK_Complaints] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Complaints_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Complaints_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Complaints_Users_ResolvedByUserId] FOREIGN KEY ([ResolvedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] int NOT NULL IDENTITY,
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
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Payments_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [RequestMedia] (
        [Id] int NOT NULL IDENTITY,
        [RequestId] int NOT NULL,
        [MediaUrl] nvarchar(500) NOT NULL,
        [MediaType] int NOT NULL,
        [UploadStage] int NOT NULL,
        [UploadedByUserId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RequestMedia] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RequestMedia_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RequestMedia_Users_UploadedByUserId] FOREIGN KEY ([UploadedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [RequestStatusHistory] (
        [Id] int NOT NULL IDENTITY,
        [RequestId] int NOT NULL,
        [Status] int NOT NULL,
        [Note] nvarchar(500) NOT NULL,
        [ChangedByUserId] int NOT NULL,
        [Timestamp] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RequestStatusHistory] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RequestStatusHistory_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RequestStatusHistory_Users_ChangedByUserId] FOREIGN KEY ([ChangedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Reviews] (
        [Id] int NOT NULL IDENTITY,
        [RequestId] int NOT NULL,
        [CustomerId] int NOT NULL,
        [ProviderProfileId] int NOT NULL,
        [Rating] int NOT NULL,
        [Comment] nvarchar(1000) NOT NULL,
        [IsVisible] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Reviews] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Reviews_ProviderProfiles_ProviderProfileId] FOREIGN KEY ([ProviderProfileId]) REFERENCES [ProviderProfiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reviews_ServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reviews_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [ServiceHistory] (
        [Id] int NOT NULL IDENTITY,
        [ApplianceId] int NOT NULL,
        [ServiceRequestId] int NULL,
        [ServiceDone] nvarchar(500) NOT NULL,
        [AmountPaid] decimal(18,2) NOT NULL,
        [ProviderName] nvarchar(100) NULL,
        [ProviderId] int NULL,
        [ServiceDate] datetime2 NOT NULL,
        [NextServiceRecommendedDate] datetime2 NOT NULL,
        [ReminderSent] bit NOT NULL,
        [Notes] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ServiceHistory] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ServiceHistory_Appliances_ApplianceId] FOREIGN KEY ([ApplianceId]) REFERENCES [Appliances] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ServiceHistory_ServiceRequests_ServiceRequestId] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE TABLE [Refunds] (
        [Id] int NOT NULL IDENTITY,
        [PaymentId] int NOT NULL,
        [RazorpayRefundId] nvarchar(100) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [ProcessedAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Refunds] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Refunds_Payments_PaymentId] FOREIGN KEY ([PaymentId]) REFERENCES [Payments] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Addresses_UserId] ON [Addresses] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Appliances_UserId] ON [Appliances] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_EntityId] ON [AuditLogs] ([EntityId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_EntityName] ON [AuditLogs] ([EntityName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Timestamp] ON [AuditLogs] ([Timestamp]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Complaints_CustomerId] ON [Complaints] ([CustomerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Complaints_RequestId] ON [Complaints] ([RequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Complaints_ResolvedByUserId] ON [Complaints] ([ResolvedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Complaints_Status] ON [Complaints] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId_IsRead] ON [Notifications] ([UserId], [IsRead]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Payments_RazorpayOrderId] ON [Payments] ([RazorpayOrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Payments_RequestId] ON [Payments] ([RequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Payments_Status] ON [Payments] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ProviderDocuments_ProviderProfileId] ON [ProviderDocuments] ([ProviderProfileId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ProviderProfiles_Status] ON [ProviderProfiles] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProviderProfiles_UserId] ON [ProviderProfiles] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Refunds_PaymentId] ON [Refunds] ([PaymentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Refunds_RazorpayRefundId] ON [Refunds] ([RazorpayRefundId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_RequestMedia_RequestId] ON [RequestMedia] ([RequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_RequestMedia_UploadedByUserId] ON [RequestMedia] ([UploadedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_RequestStatusHistory_ChangedByUserId] ON [RequestStatusHistory] ([ChangedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_RequestStatusHistory_RequestId] ON [RequestStatusHistory] ([RequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_RequestStatusHistory_Timestamp] ON [RequestStatusHistory] ([Timestamp]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Reviews_CustomerId] ON [Reviews] ([CustomerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Reviews_ProviderProfileId] ON [Reviews] ([ProviderProfileId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Reviews_RequestId] ON [Reviews] ([RequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ServiceCategories_Slug] ON [ServiceCategories] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceHistory_ApplianceId] ON [ServiceHistory] ([ApplianceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceHistory_NextServiceRecommendedDate] ON [ServiceHistory] ([NextServiceRecommendedDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceHistory_ReminderSent_NextServiceRecommendedDate] ON [ServiceHistory] ([ReminderSent], [NextServiceRecommendedDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ServiceHistory_ServiceRequestId] ON [ServiceHistory] ([ServiceRequestId]) WHERE [ServiceRequestId] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceRequests_AddressId] ON [ServiceRequests] ([AddressId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceRequests_CustomerId] ON [ServiceRequests] ([CustomerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceRequests_ProviderProfileId] ON [ServiceRequests] ([ProviderProfileId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceRequests_ScheduledDate] ON [ServiceRequests] ([ScheduledDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceRequests_ServiceId] ON [ServiceRequests] ([ServiceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceRequests_Status] ON [ServiceRequests] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_ServiceRequests_Status_CreatedAt] ON [ServiceRequests] ([Status], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ServiceRequests_TrackingNumber] ON [ServiceRequests] ([TrackingNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Services_CategoryId] ON [Services] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260930092240_InitialSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260930092240_InitialSchema', N'9.0.0');
END;

-- Migration: Location-Based Nearest Provider System
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[ProviderProfiles]') AND name = 'ServiceRadiusKm'
)
BEGIN
    ALTER TABLE [ProviderProfiles] ADD [ServiceRadiusKm] int NOT NULL CONSTRAINT [DF_ProviderProfiles_ServiceRadiusKm] DEFAULT 15;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[ServiceRequests]') AND name = 'AssignedAt'
)
BEGIN
    ALTER TABLE [ServiceRequests] ADD [AssignedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[ServiceRequests]') AND name = 'DistanceKm'
)
BEGIN
    ALTER TABLE [ServiceRequests] ADD [DistanceKm] decimal(8,2) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProviderSkills')
BEGIN
    CREATE TABLE [ProviderSkills] (
        [Id] int NOT NULL IDENTITY,
        [ProviderProfileId] int NOT NULL,
        [ServiceId] int NOT NULL,
        CONSTRAINT [PK_ProviderSkills] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProviderSkills_ProviderProfiles_ProviderProfileId] FOREIGN KEY ([ProviderProfileId]) REFERENCES [ProviderProfiles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProviderSkills_Services_ServiceId] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX [IX_ProviderSkills_ProviderProfileId_ServiceId] ON [ProviderSkills] ([ProviderProfileId], [ServiceId]);
    CREATE INDEX [IX_ProviderSkills_ServiceId] ON [ProviderSkills] ([ServiceId]);
END;

COMMIT;
GO

