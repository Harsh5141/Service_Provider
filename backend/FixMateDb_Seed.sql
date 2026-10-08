-- =============================================================================
-- FixMate Database Seed Script (Location-Based Provider Matching System)
-- Execute this in SSMS against the FixMateDb database
-- =============================================================================

USE [FixMateDb];
GO

-- 1. Seed Users (Default Password for all seeded accounts is: Password123!)
-- BCrypt hash for "Password123!" ($2a$11$qRz4hR8jH/l2pM51rY021uQp2K3uK5iXW2vP/q4A5E3qU0L9m/j6.)
IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Email] = 'admin@fixmate.test')
BEGIN
    INSERT INTO [Users] ([Name], [Email], [Phone], [PasswordHash], [Role], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES 
    (N'FixMate Admin', N'admin@fixmate.test', N'+919876543210', N'$2a$11$qRz4hR8jH/l2pM51rY021uQp2K3uK5iXW2vP/q4A5E3qU0L9m/j6.', 3, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0),
    (N'John Doe', N'john@fixmate.test', N'+919876543211', N'$2a$11$qRz4hR8jH/l2pM51rY021uQp2K3uK5iXW2vP/q4A5E3qU0L9m/j6.', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0),
    (N'Priya Sharma', N'priya@fixmate.test', N'+919876543212', N'$2a$11$qRz4hR8jH/l2pM51rY021uQp2K3uK5iXW2vP/q4A5E3qU0L9m/j6.', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0),
    (N'Rajesh Kumar', N'rajesh@fixmate.test', N'+919876543213', N'$2a$11$qRz4hR8jH/l2pM51rY021uQp2K3uK5iXW2vP/q4A5E3qU0L9m/j6.', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0),
    (N'Amit Singh', N'amit@fixmate.test', N'+919876543214', N'$2a$11$qRz4hR8jH/l2pM51rY021uQp2K3uK5iXW2vP/q4A5E3qU0L9m/j6.', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END
GO

-- 2. Seed Addresses for Customers & Providers
DECLARE @JohnId INT = (SELECT [Id] FROM [Users] WHERE [Email] = 'john@fixmate.test');
DECLARE @RajeshId INT = (SELECT [Id] FROM [Users] WHERE [Email] = 'rajesh@fixmate.test');
DECLARE @AmitId INT = (SELECT [Id] FROM [Users] WHERE [Email] = 'amit@fixmate.test');

IF @JohnId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [Addresses] WHERE [UserId] = @JohnId)
BEGIN
    INSERT INTO [Addresses] ([UserId], [Label], [Street], [City], [State], [PostalCode], [Latitude], [Longitude], [IsDefault], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (@JohnId, N'Home', N'12 Station Road', N'Valsad', N'Gujarat', N'396001', 20.6139, 72.9342, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END

IF @RajeshId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [Addresses] WHERE [UserId] = @RajeshId)
BEGIN
    INSERT INTO [Addresses] ([UserId], [Label], [Street], [City], [State], [PostalCode], [Latitude], [Longitude], [IsDefault], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (@RajeshId, N'Base Office', N'12 Station Road', N'Valsad', N'Gujarat', N'396001', 20.6150, 72.9342, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END

IF @AmitId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [Addresses] WHERE [UserId] = @AmitId)
BEGIN
    INSERT INTO [Addresses] ([UserId], [Label], [Street], [City], [State], [PostalCode], [Latitude], [Longitude], [IsDefault], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (@AmitId, N'Workshop', N'45 Market Road', N'Valsad', N'Gujarat', N'396001', 20.6200, 72.9380, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END
GO

-- 3. Seed Provider Profiles
DECLARE @RajeshId INT = (SELECT [Id] FROM [Users] WHERE [Email] = 'rajesh@fixmate.test');
DECLARE @AmitId INT = (SELECT [Id] FROM [Users] WHERE [Email] = 'amit@fixmate.test');

IF @RajeshId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [ProviderProfiles] WHERE [UserId] = @RajeshId)
BEGIN
    INSERT INTO [ProviderProfiles] ([UserId], [Bio], [ExperienceYears], [RatingAverage], [RatingCount], [Status], [IsAvailable], [ServiceRadiusKm], [CommissionRate], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (@RajeshId, N'Certified Master Electrician & AC Specialist with 8+ years experience.', 8, 4.95, 142, 2, 1, 15, 0.15, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END

IF @AmitId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [ProviderProfiles] WHERE [UserId] = @AmitId)
BEGIN
    INSERT INTO [ProviderProfiles] ([UserId], [Bio], [ExperienceYears], [RatingAverage], [RatingCount], [Status], [IsAvailable], [ServiceRadiusKm], [CommissionRate], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (@AmitId, N'Professional plumber & sanitary expert with 5 years experience.', 5, 4.88, 89, 2, 1, 10, 0.15, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END
GO

-- 4. Seed Service Categories & Services
IF NOT EXISTS (SELECT 1 FROM [ServiceCategories] WHERE [Name] = 'AC & Appliance Repair')
BEGIN
    INSERT INTO [ServiceCategories] ([Name], [Slug], [Description], [IconName], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (N'AC & Appliance Repair', N'ac-appliance-repair', N'Air conditioners, washing machines, and home appliances', N'Wind', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
    
    DECLARE @CatAcId INT = SCOPE_IDENTITY();
    INSERT INTO [Services] ([CategoryId], [Name], [Description], [BasePrice], [EstimatedDurationMinutes], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES 
    (@CatAcId, N'AC Repair & Servicing', N'Foam jet cleaning, cooling troubleshooting, gas check, and filter sanitization', 499.00, 60, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0),
    (@CatAcId, N'Washing Machine Diagnostic & Repair', N'Drum spin check, motor belt replacement, and drain pump repair', 399.00, 60, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END

IF NOT EXISTS (SELECT 1 FROM [ServiceCategories] WHERE [Name] = 'Electrical & Power')
BEGIN
    INSERT INTO [ServiceCategories] ([Name], [Slug], [Description], [IconName], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (N'Electrical & Power', N'electrical-power', N'Wiring, switchboards, MCB, fans, and fixtures', N'Zap', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
    
    DECLARE @CatElecId INT = SCOPE_IDENTITY();
    INSERT INTO [Services] ([CategoryId], [Name], [Description], [BasePrice], [EstimatedDurationMinutes], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES 
    (@CatElecId, N'Switchboard Installation & Repair', N'Inspection and repair of burnt or loose modular switchboards and sockets', 199.00, 45, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0),
    (@CatElecId, N'Ceiling Fan Installation & Repair', N'Secure bracket mounting, regulator balancing, and full wiring test', 249.00, 60, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END

IF NOT EXISTS (SELECT 1 FROM [ServiceCategories] WHERE [Name] = 'Plumbing & Sanitary')
BEGIN
    INSERT INTO [ServiceCategories] ([Name], [Slug], [Description], [IconName], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES (N'Plumbing & Sanitary', N'plumbing-sanitary', N'Pipes, leakages, taps, and sanitary drainage', N'Droplets', 3, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
    
    DECLARE @CatPlumbId INT = SCOPE_IDENTITY();
    INSERT INTO [Services] ([CategoryId], [Name], [Description], [BasePrice], [EstimatedDurationMinutes], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted])
    VALUES 
    (@CatPlumbId, N'Plumbing & Drainage', N'Dripping faucets, valve replacements, drain cleaning, and leaks', 299.00, 45, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0);
END
GO

-- 5. Seed ProviderSkills Table
DECLARE @RajeshProfileId INT = (SELECT p.[Id] FROM [ProviderProfiles] p JOIN [Users] u ON p.[UserId] = u.[Id] WHERE u.[Email] = 'rajesh@fixmate.test');
DECLARE @AmitProfileId INT = (SELECT p.[Id] FROM [ProviderProfiles] p JOIN [Users] u ON p.[UserId] = u.[Id] WHERE u.[Email] = 'amit@fixmate.test');

DECLARE @AcServiceId INT = (SELECT [Id] FROM [Services] WHERE [Name] = 'AC Repair & Servicing');
DECLARE @ElecServiceId INT = (SELECT [Id] FROM [Services] WHERE [Name] = 'Switchboard Installation & Repair');
DECLARE @PlumbServiceId INT = (SELECT [Id] FROM [Services] WHERE [Name] = 'Plumbing & Drainage');

IF @RajeshProfileId IS NOT NULL AND @AcServiceId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [ProviderSkills] WHERE [ProviderProfileId] = @RajeshProfileId AND [ServiceId] = @AcServiceId)
BEGIN
    INSERT INTO [ProviderSkills] ([ProviderProfileId], [ServiceId])
    VALUES (@RajeshProfileId, @AcServiceId);
END

IF @RajeshProfileId IS NOT NULL AND @ElecServiceId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [ProviderSkills] WHERE [ProviderProfileId] = @RajeshProfileId AND [ServiceId] = @ElecServiceId)
BEGIN
    INSERT INTO [ProviderSkills] ([ProviderProfileId], [ServiceId])
    VALUES (@RajeshProfileId, @ElecServiceId);
END

IF @AmitProfileId IS NOT NULL AND @PlumbServiceId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [ProviderSkills] WHERE [ProviderProfileId] = @AmitProfileId AND [ServiceId] = @PlumbServiceId)
BEGIN
    INSERT INTO [ProviderSkills] ([ProviderProfileId], [ServiceId])
    VALUES (@AmitProfileId, @PlumbServiceId);
END
GO
