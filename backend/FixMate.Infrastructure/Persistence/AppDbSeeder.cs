using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using FixMate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FixMate.Infrastructure.Persistence;

public class AppDbSeeder
{
    private readonly AppDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IGeoLocationService _geoLocationService;

    public AppDbSeeder(AppDbContext context, IPasswordService passwordService, IGeoLocationService geoLocationService)
    {
        _context = context;
        _passwordService = passwordService;
        _geoLocationService = geoLocationService;
    }

    public async Task SeedAsync()
    {
        var defaultPasswordHash = _passwordService.HashPassword("Password123!");

        // ── 0. Clean Up Old Demo Providers ───────────────────────────────────────
        var oldProviderEmails = new[]
        {
            "rajesh@fixmate.test",
            "amit@fixmate.test",
            "rahul@fixmate.test",
            "vijay@fixmate.test",
            "suresh@fixmate.test"
        };

        foreach (var oldEmail in oldProviderEmails)
        {
            var oldUser = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == oldEmail);
            if (oldUser != null)
            {
                var oldProfile = await _context.ProviderProfiles.Include(p => p.Skills).FirstOrDefaultAsync(p => p.UserId == oldUser.Id);
                if (oldProfile != null)
                {
                    // Unlink any service requests assigned to old provider profile
                    var oldRequests = await _context.ServiceRequests.Where(r => r.ProviderProfileId == oldProfile.Id).ToListAsync();
                    foreach (var req in oldRequests)
                    {
                        req.ProviderProfileId = null;
                    }

                    _context.ProviderSkills.RemoveRange(oldProfile.Skills);
                    _context.ProviderProfiles.Remove(oldProfile);
                }

                var oldAddresses = await _context.Addresses.Where(a => a.UserId == oldUser.Id).ToListAsync();
                _context.Addresses.RemoveRange(oldAddresses);

                oldUser.IsActive = false;
                oldUser.IsDeleted = true;
                oldUser.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _context.SaveChangesAsync();

        // ── 1. Seed or Update 5 Customer Users & 1 Admin ─────────────────────────
        var coreUsers = new (string Name, string Email, string Phone, UserRole Role)[]
        {
            ("FixMate Admin", "admin@fixmate.test", "+919876543210", UserRole.Admin),
            ("John Doe", "john@fixmate.test", "+919876543211", UserRole.User),
            ("Priya Sharma", "priya@fixmate.test", "+919876543212", UserRole.User),
            ("Ananya Patel", "ananya@fixmate.test", "+919876543213", UserRole.User),
            ("Rohan Desai", "rohan@fixmate.test", "+919876543214", UserRole.User),
            ("Sneha Mehta", "sneha@fixmate.test", "+919876543215", UserRole.User),
        };

        foreach (var (name, email, phone, role) in coreUsers)
        {
            var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                user = new User
                {
                    Name = name,
                    Email = email,
                    Phone = phone,
                    PasswordHash = defaultPasswordHash,
                    Role = role,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
            }
            else
            {
                user.Name = name;
                user.Phone = phone;
                user.PasswordHash = defaultPasswordHash;
                user.IsActive = true;
                user.Role = role;
                user.IsDeleted = false;
                user.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _context.SaveChangesAsync();

        // ── 2. Seed Customer Addresses (Valsad, Gujarat) ──────────────────────────
        var customerAddressMap = new (string Email, string Label, string Street, string City, string PostalCode, decimal Lat, decimal Lon)[]
        {
            ("john@fixmate.test", "Home (Default)", "12 Station Road", "Valsad", "396001", 20.6139m, 72.9342m),
            ("john@fixmate.test", "Office", "Flat 402, Sunshine Heights, 12th Cross", "Valsad", "396001", 20.6150m, 72.9360m),
            ("priya@fixmate.test", "Home", "Tower 4, Green Valley Apartments", "Valsad", "396001", 20.6145m, 72.9348m),
            ("ananya@fixmate.test", "Home", "45 Tithal Road, Near Jalaram Temple", "Valsad", "396001", 20.6175m, 72.9250m),
            ("rohan@fixmate.test", "Home", "B-102, Shanti Nagar, Dharampur Road", "Valsad", "396002", 20.6270m, 72.9430m),
            ("sneha@fixmate.test", "Home", "18 Mograwadi Main Road", "Valsad", "396001", 20.6195m, 72.9330m),
        };

        foreach (var (email, label, street, city, postalCode, lat, lon) in customerAddressMap)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user != null && !await _context.Addresses.AnyAsync(a => a.UserId == user.Id && a.Street == street))
            {
                _context.Addresses.Add(new Address
                {
                    UserId = user.Id,
                    Label = label,
                    Street = street,
                    City = city,
                    State = "Gujarat",
                    PostalCode = postalCode,
                    Latitude = lat,
                    Longitude = lon,
                    IsDefault = label.Contains("Default") || !await _context.Addresses.AnyAsync(a => a.UserId == user.Id),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }
        await _context.SaveChangesAsync();

        // ── 3. Seed 10 Distinct Service Categories & Services ────────────────────
        var categoryDefinitions = new (
            string Name,
            string Slug,
            string Description,
            string IconName,
            int DisplayOrder,
            (string Name, string Description, decimal Price, int Duration)[] Services
        )[]
        {
            (
                "Electrical & Power Solutions",
                "electrical-power",
                "Switchboard fixes, MCB fuses, ceiling fans, home wiring, and inverter installations",
                "Zap",
                1,
                new[]
                {
                    ("Switchboard Installation & Repair", "Inspection and repair of burnt or loose modular switchboards and sockets", 199.00m, 45),
                    ("Ceiling Fan Installation / Replacement", "Secure bracket mounting, regulator balancing, and full wiring test", 249.00m, 60),
                    ("MCB / Fuse Box Troubleshooting", "Tripping diagnosis, short-circuit locator, and fuse replacement", 399.00m, 60)
                }
            ),
            (
                "Plumbing & Sanitary Works",
                "plumbing-sanitary",
                "Pipe leakages, tap fittings, drain blockages, water motors, and bathroom cisterns",
                "Droplets",
                2,
                new[]
                {
                    ("Tap & Mixer Repair / Replacement", "Fix dripping faucets, washers, cartridges, or brand-new tap installation", 149.00m, 30),
                    ("Clogged Drain & Sink Cleaning", "Deep mechanical snake unclogging for kitchen sinks and bathroom drains", 349.00m, 60),
                    ("Toilet Flush Tank & Cistern Repair", "Syphon kit overhaul, inlet valve fix, and leak stoppage", 299.00m, 45)
                }
            ),
            (
                "AC & HVAC Cooling Services",
                "ac-cooling-services",
                "Split & window air conditioner maintenance, gas charging, coil cleaning & PCB repairs",
                "Wind",
                3,
                new[]
                {
                    ("AC Foam Jet Deep Cleaning (Split / Window)", "High-pressure jet wash with antibacterial foam, coil cleaning & airflow check", 499.00m, 60),
                    ("AC Gas Leakage Inspection & Refill", "Nitrogen pressure testing, flare nut tightening, and R32/R410A gas charging", 1499.00m, 75),
                    ("Inverter AC PCB Circuit Diagnostic", "Power PCB repair, sensor replacement, and inverter compressor relay fix", 599.00m, 60)
                }
            ),
            (
                "Home Appliance Repair",
                "home-appliance-repair",
                "Front/top load washing machines, refrigerators, microwaves, and induction cooktops",
                "Tv",
                4,
                new[]
                {
                    ("Washing Machine Diagnostic & Repair", "Spin issue, drainage motor fault, belt replacement, and PCB error check", 399.00m, 60),
                    ("Refrigerator Cooling Troubleshooting", "Compressor relay test, thermostat check, and gas leakage assessment", 449.00m, 60),
                    ("Microwave Oven Heating & Magnetron Repair", "High-voltage diode test, turntable motor fix, and magnetron replacement", 349.00m, 45)
                }
            ),
            (
                "Deep Cleaning & Sanitization",
                "deep-cleaning-sanitization",
                "Intense bathroom descaling, sofa fabric shampooing, kitchen degreasing, and full home deep clean",
                "Sparkles",
                5,
                new[]
                {
                    ("Intense Bathroom Deep Scrub & Descaling", "Hard water stain removal, tile descaling, sanitize fixtures and grout", 599.00m, 90),
                    ("Sofa Shampooing & Extraction (3-Seater)", "Deep fabric vacuuming, organic detergent scrub, and moisture extraction", 699.00m, 75),
                    ("Full Villa & Apartment Intensive Deep Cleaning", "Floor buffing, kitchen degreasing, window glass clean, and sanitization", 1999.00m, 180)
                }
            ),
            (
                "Carpentry & Furniture Assembly",
                "carpentry-furniture",
                "Wooden doors, locks, hinges, modular furniture setup, cabinet fittings, and custom shelves",
                "Hammer",
                6,
                new[]
                {
                    ("Door Lock, Handle & Hinge Installation", "Mortise lock fitting, cylindrical handle replacement, and hinge alignment", 249.00m, 40),
                    ("Modular Bed & Wardrobe Assembly", "Precision knockdown furniture assembly, drawer slides, and leveling", 699.00m, 90),
                    ("Custom Wall Shelf & Cabinet Fitting", "Solid wall anchor drilling, bracket mounting, and modular cabinet fixing", 399.00m, 60)
                }
            ),
            (
                "Painting & Wall Waterproofing",
                "painting-waterproofing",
                "Interior room wall painting, dampness proofing, texture finishes, and ceiling touch-ups",
                "Paintbrush",
                7,
                new[]
                {
                    ("Interior Room Fresh Coat Painting", "Two coats of premium acrylic emulsion with masking and floor covering", 1499.00m, 180),
                    ("Wall Dampness & Ceiling Waterproof Treatment", "Dr. Fixit polymer coating, crack bridging, and anti-efflorescence coat", 999.00m, 120),
                    ("Wall Putty, Primer & Crack Filling", "Surface sanding, acrylic putty smoothing, and primer application", 499.00m, 90)
                }
            ),
            (
                "Pest Control & Disinfection",
                "pest-control-services",
                "Anti-termite treatment, odorless cockroach gel, bed bug eradication, and rodent management",
                "ShieldAlert",
                8,
                new[]
                {
                    ("Herbal Cockroach & Ant Gel Treatment", "Odorless Bayer Maxforce gel dots across kitchen corners and electrical points", 499.00m, 45),
                    ("Complete Anti-Termite Wood Drill & Injection", "Drill-fill-seal subterranean termite treatment with imidacloprid chemical", 1299.00m, 120),
                    ("Bed Bug & Rodent Intensive Eradication", "Two-round synthetic pyrethroid spray and industrial glue trap placement", 799.00m, 60)
                }
            ),
            (
                "RO Water Purifier & Geyser Care",
                "water-purifier-geyser",
                "RO filter membrane replacement, water TDS calibration, instant/storage geyser heating repairs",
                "Flame",
                9,
                new[]
                {
                    ("RO Water Purifier Full Service & Filter Replacement", "Sediment, carbon filter change, RO membrane flush, and TDS adjustment", 499.00m, 45),
                    ("Geyser Heating Element & Thermostat Replacement", "Scale descaling, copper heating rod change, and safety thermostat test", 399.00m, 45),
                    ("Water Softener & Pressure Pump Maintenance", "Resin recharge, flow sensor check, and booster pump pressure tuning", 549.00m, 60)
                }
            ),
            (
                "Smart Home & CCTV Security",
                "smart-home-security",
                "CCTV camera setup, smart video doorbells, smart locks, Wi-Fi mesh configuration, and sensors",
                "Camera",
                10,
                new[]
                {
                    ("CCTV Camera Installation & Wiring", "IP / HD camera outdoor mounting, BNC/CAT6 crimping, and DVR/NVR setup", 349.00m, 45),
                    ("Smart Video Doorbell & Digital Lock Setup", "Fingerprint / PIN smart lock installation, Wi-Fi chime sync, and app config", 499.00m, 60),
                    ("Smart Home Hub & Sensor Automation Setup", "Zigbee / Matter gateway integration with smart switches and motion sensors", 799.00m, 90)
                }
            )
        };

        var validSlugs = categoryDefinitions.Select(d => d.Slug).ToList();
        var obsoleteCategories = await _context.ServiceCategories
            .Include(c => c.Services)
            .Where(c => !validSlugs.Contains(c.Slug))
            .ToListAsync();

        foreach (var oldCat in obsoleteCategories)
        {
            oldCat.IsActive = false;
            oldCat.IsDeleted = true;
            foreach (var s in oldCat.Services)
            {
                s.IsActive = false;
                s.IsDeleted = true;
            }
        }
        await _context.SaveChangesAsync();

        foreach (var def in categoryDefinitions)
        {
            var category = await _context.ServiceCategories.Include(c => c.Services).FirstOrDefaultAsync(c => c.Slug == def.Slug);
            if (category == null)
            {
                category = new ServiceCategory
                {
                    Name = def.Name,
                    Slug = def.Slug,
                    Description = def.Description,
                    IconName = def.IconName,
                    DisplayOrder = def.DisplayOrder,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ServiceCategories.Add(category);
                await _context.SaveChangesAsync();
            }
            else
            {
                category.Name = def.Name;
                category.Description = def.Description;
                category.IconName = def.IconName;
                category.DisplayOrder = def.DisplayOrder;
                category.IsActive = true;
                category.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            foreach (var (svcName, svcDesc, svcPrice, svcDuration) in def.Services)
            {
                var service = category.Services.FirstOrDefault(s => s.Name == svcName);
                if (service == null)
                {
                    service = new Service
                    {
                        CategoryId = category.Id,
                        Name = svcName,
                        Description = svcDesc,
                        BasePrice = svcPrice,
                        EstimatedDurationMinutes = svcDuration,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Services.Add(service);
                }
                else
                {
                    service.Description = svcDesc;
                    service.BasePrice = svcPrice;
                    service.EstimatedDurationMinutes = svcDuration;
                    service.IsActive = true;
                    service.UpdatedAt = DateTime.UtcNow;
                }
            }
            await _context.SaveChangesAsync();
        }

        // ── 4. Seed 10 Providers (Each with a Distinct Category) ─────────────────
        var allDbCategories = await _context.ServiceCategories.Include(c => c.Services).ToListAsync();

        var providerDefinitions = new (
            string Name,
            string Email,
            string Phone,
            string Bio,
            string CategorySlug,
            int ExperienceYears,
            decimal RatingAverage,
            int RatingCount,
            string Street,
            string City,
            string PostalCode,
            decimal Lat,
            decimal Lon
        )[]
        {
            // 1. Electrical & Power Solutions
            (
                "Aarav Patel",
                "aarav.provider@fixmate.test",
                "+919820010001",
                "Licensed Master Electrician specializing in residential wiring, MCB distribution boxes, inverter setups, and ceiling fans.",
                "electrical-power",
                7,
                4.92m,
                95,
                "Shop 4, Station Road",
                "Valsad",
                "396001",
                20.6139m,
                72.9342m
            ),
            // 2. Plumbing & Sanitary Works
            (
                "Bhavin Mehta",
                "bhavin.provider@fixmate.test",
                "+919820010002",
                "Certified sanitary engineer with 6+ years experience in concealed pipe leakages, taps, flush tanks, and drainage clearance.",
                "plumbing-sanitary",
                6,
                4.88m,
                82,
                "18 Tithal Beach Road",
                "Valsad",
                "396001",
                20.6155m,
                72.9280m
            ),
            // 3. AC & HVAC Cooling Services
            (
                "Chetan Solanki",
                "chetan.provider@fixmate.test",
                "+919820010003",
                "HVAC Cooling Specialist expert in high-pressure AC foam jet cleaning, gas charging, leak tests, and inverter PCB repairs.",
                "ac-cooling-services",
                8,
                4.95m,
                140,
                "54 Dharampur Road",
                "Valsad",
                "396002",
                20.6280m,
                72.9450m
            ),
            // 4. Home Appliance Repair
            (
                "Deepak Verma",
                "deepak.provider@fixmate.test",
                "+919820010004",
                "Home appliance master technician for front & top load washing machines, refrigerators, microwave ovens, and induction hobs.",
                "home-appliance-repair",
                5,
                4.84m,
                67,
                "B-12 College Road",
                "Valsad",
                "396001",
                20.6170m,
                72.9360m
            ),
            // 5. Deep Cleaning & Sanitization
            (
                "Eshwar Joshi",
                "eshwar.provider@fixmate.test",
                "+919820010005",
                "Professional hygiene specialist in machine bathroom tile descaling, sofa fabric shampooing, and villa intensive deep clean.",
                "deep-cleaning-sanitization",
                5,
                4.90m,
                112,
                "Tower 3, Mograwadi",
                "Valsad",
                "396001",
                20.6200m,
                72.9320m
            ),
            // 6. Carpentry & Furniture Assembly
            (
                "Farhan Shaikh",
                "farhan.provider@fixmate.test",
                "+919820010006",
                "Precision carpenter for wooden mortise locks, modular wardrobe/bed assembly, drawer channels, and custom shelf fittings.",
                "carpentry-furniture",
                6,
                4.86m,
                58,
                "22 Halar Road",
                "Valsad",
                "396001",
                20.6110m,
                72.9305m
            ),
            // 7. Painting & Wall Waterproofing
            (
                "Girish Nayak",
                "girish.provider@fixmate.test",
                "+919820010007",
                "Master painter with 9+ years experience in interior emulsion coatings, damp wall polymer waterproofing, and crack repairs.",
                "painting-waterproofing",
                9,
                4.94m,
                168,
                "Block C, Abrama Road",
                "Valsad",
                "396002",
                20.6250m,
                72.9400m
            ),
            // 8. Pest Control & Disinfection
            (
                "Harish Rathod",
                "harish.provider@fixmate.test",
                "+919820010008",
                "Certified pest management technician specializing in odorless anti-cockroach gel, subterranean termite drill, and bed bug relief.",
                "pest-control-services",
                6,
                4.87m,
                79,
                "10 Station Road",
                "Valsad",
                "396001",
                20.6130m,
                72.9335m
            ),
            // 9. RO Water Purifier & Geyser Care
            (
                "Ishaan Dave",
                "ishaan.provider@fixmate.test",
                "+919820010009",
                "Water purifier & geyser technician for RO membrane filter replacement, TDS balancing, copper heating coils, and thermostats.",
                "water-purifier-geyser",
                4,
                4.82m,
                46,
                "Shanti Niketan, Kacheri Road",
                "Valsad",
                "396001",
                20.6160m,
                72.9310m
            ),
            // 10. Smart Home & CCTV Security
            (
                "Jatin Mistry",
                "jatin.provider@fixmate.test",
                "+919820010010",
                "Smart security and CCTV specialist for HD/IP camera installation, digital door locks, video doorbells, and home automation.",
                "smart-home-security",
                8,
                4.91m,
                130,
                "Shop 8, Gundlav GIDC Road",
                "Valsad",
                "396035",
                20.6050m,
                72.9550m
            )
        };

        foreach (var def in providerDefinitions)
        {
            var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == def.Email);
            if (user == null)
            {
                user = new User
                {
                    Name = def.Name,
                    Email = def.Email,
                    Phone = def.Phone,
                    PasswordHash = defaultPasswordHash,
                    Role = UserRole.Provider,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else
            {
                user.Name = def.Name;
                user.Phone = def.Phone;
                user.PasswordHash = defaultPasswordHash;
                user.Role = UserRole.Provider;
                user.IsActive = true;
                user.IsDeleted = false;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            // Address
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.UserId == user.Id);
            if (address == null)
            {
                address = new Address
                {
                    UserId = user.Id,
                    Label = "Service Base",
                    Street = def.Street,
                    City = def.City,
                    State = "Gujarat",
                    PostalCode = def.PostalCode,
                    Latitude = def.Lat,
                    Longitude = def.Lon,
                    IsDefault = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();
            }
            else
            {
                address.Street = def.Street;
                address.City = def.City;
                address.PostalCode = def.PostalCode;
                address.Latitude = def.Lat;
                address.Longitude = def.Lon;
                address.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            // Profile
            var profile = await _context.ProviderProfiles.Include(p => p.Skills).FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (profile == null)
            {
                profile = new ProviderProfile
                {
                    UserId = user.Id,
                    Bio = def.Bio,
                    ExperienceYears = def.ExperienceYears,
                    RatingAverage = def.RatingAverage,
                    RatingCount = def.RatingCount,
                    Status = ProviderStatus.Active,
                    IsAvailable = true,
                    ServiceRadiusKm = 15,
                    CommissionRate = 0.15m,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ProviderProfiles.Add(profile);
                await _context.SaveChangesAsync();
            }
            else
            {
                profile.Bio = def.Bio;
                profile.ExperienceYears = def.ExperienceYears;
                profile.RatingAverage = def.RatingAverage;
                profile.RatingCount = def.RatingCount;
                profile.Status = ProviderStatus.Active;
                profile.IsAvailable = true;
                profile.ServiceRadiusKm = 15;
                profile.CommissionRate = 0.15m;
                profile.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            // Clear existing skills and re-assign exclusively to their own distinct Category services
            _context.ProviderSkills.RemoveRange(profile.Skills);
            await _context.SaveChangesAsync();

            var assignedCategory = allDbCategories.FirstOrDefault(c => c.Slug == def.CategorySlug);
            if (assignedCategory != null)
            {
                foreach (var svc in assignedCategory.Services)
                {
                    profile.Skills.Add(new ProviderSkill
                    {
                        ServiceId = svc.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();
            }
        }

        // ── 5. Clear / Reset All Service Bookings & Request Data ──────────────
        try
        {
            await _context.Database.ExecuteSqlRawAsync(@"
                DELETE FROM [dbo].[Refunds];
                DELETE FROM [dbo].[Payments];
                DELETE FROM [dbo].[Reviews];
                DELETE FROM [dbo].[Complaints];
                DELETE FROM [dbo].[RequestMedia];
                DELETE FROM [dbo].[RequestStatusHistory];
                DELETE FROM [dbo].[ServiceHistory];
                DELETE FROM [dbo].[ServiceRequests];
            ");
            Console.WriteLine("[Seeder] Successfully cleared all service bookings and requests from database.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Seeder] Service request cleanup note: {ex.Message}");
        }

        await _context.SaveChangesAsync();
    }
}
