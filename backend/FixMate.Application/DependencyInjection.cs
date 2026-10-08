using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace FixMate.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Registers Application layer services:
    /// AutoMapper profiles, FluentValidation validators, and application service implementations.
    /// All registrations use the assembly scan to stay low-maintenance as more services are added.
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // AutoMapper — scans all Profile subclasses in this assembly
        services.AddAutoMapper(assembly);

        // FluentValidation — scans all AbstractValidator<T> in this assembly
        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}
