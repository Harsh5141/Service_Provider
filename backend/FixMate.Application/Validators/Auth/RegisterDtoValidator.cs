using FluentValidation;
using FixMate.Application.DTOs.Auth;

namespace FixMate.Application.Validators.Auth;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(200);

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^[6-9]\d{9}$").WithMessage("Please enter a valid 10-digit Indian phone number.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

        When(x => !string.IsNullOrWhiteSpace(x.PostalCode), () =>
        {
            RuleFor(x => x.PostalCode!)
                .Matches(@"^[1-9][0-9]{5}$").WithMessage("Please enter a valid 6-digit Indian PIN code.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.Address), () =>
        {
            RuleFor(x => x.Address!)
                .MaximumLength(200).WithMessage("Address cannot exceed 200 characters.");
        });
    }
}

