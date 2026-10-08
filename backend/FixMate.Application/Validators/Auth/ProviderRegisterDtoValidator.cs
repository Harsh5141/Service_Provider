using FluentValidation;
using FixMate.Application.DTOs.Auth;

namespace FixMate.Application.Validators.Auth;

public class ProviderRegisterDtoValidator : AbstractValidator<ProviderRegisterDto>
{
    public ProviderRegisterDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^[6-9]\d{9}$").WithMessage("Please enter a valid 10-digit Indian phone number.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

        RuleFor(x => x.Bio)
            .MaximumLength(1000).WithMessage("Bio cannot exceed 1000 characters.");

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years must be 0 or more.");

        RuleFor(x => x.ServiceRadiusKm)
            .InclusiveBetween(1, 200).WithMessage("Service radius must be between 1 and 200 km.");

        When(x => !string.IsNullOrWhiteSpace(x.PostalCode), () =>
        {
            RuleFor(x => x.PostalCode!)
                .Matches(@"^[1-9][0-9]{5}$").WithMessage("Please enter a valid 6-digit Indian PIN code.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.ServiceAddress), () =>
        {
            RuleFor(x => x.ServiceAddress!)
                .MaximumLength(200).WithMessage("Service address cannot exceed 200 characters.");
        });
    }
}

