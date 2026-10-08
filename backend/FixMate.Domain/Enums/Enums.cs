namespace FixMate.Domain.Enums;

/// <summary>
/// Stored as int in the DB for compact storage and index efficiency.
/// The numeric values are fixed — never reorder; add new values at the end only.
/// </summary>
public enum RequestStatus
{
    Created         = 1,  // Customer submitted the request
    ProviderAssigned = 2, // Admin/system assigned a provider
    OnTheWay        = 3,  // Provider confirmed and heading to site
    InProgress      = 4,  // Provider marked job as started
    Completed       = 5,  // Provider marked job complete
    PendingPayment  = 6,  // Awaiting customer payment
    Paid            = 7,  // Payment confirmed
    ReviewPending   = 8,  // Awaiting customer review
    Reviewed        = 9,  // Customer left a review
    Cancelled       = 10, // Cancelled by customer or admin
    Disputed        = 11, // Complaint raised
    ProviderAccepted = 12, // Provider confirmed and accepted job
    Reassigning     = 13  // Provider cancelled; auto-reassigning to next provider
}

public enum PaymentStatus
{
    Pending    = 1,
    Processing = 2,
    Completed  = 3,
    Failed     = 4,
    Refunded   = 5,
    PartialRefund = 6
}

public enum PaymentMethod
{
    Online = 1,  // Razorpay
    Cash   = 2
}

public enum ProviderStatus
{
    PendingApproval = 1,
    Active          = 2,
    Suspended       = 3,
    Rejected        = 4
}

public enum ComplaintStatus
{
    Open       = 1,
    InReview   = 2,
    Resolved   = 3,
    Closed     = 4
}

public enum DocumentType
{
    Aadhaar      = 1,
    PAN          = 2,
    DrivingLicense = 3,
    Certificate  = 4,  // Skill/trade certificate
    Photo        = 5
}

public enum MediaType
{
    Image = 1,
    Video = 2
}

public enum NotificationType
{
    RequestUpdate    = 1,
    PaymentConfirmed = 2,
    ReviewReminder   = 3,
    ServiceReminder  = 4,
    SystemMessage    = 5,
    ProviderApproved = 6,
    NewJobAssigned   = 7
}

public enum UserRole
{
    User     = 1,
    Provider = 2,
    Admin    = 3
}
