using FixMate.Application.DTOs.Tax;

namespace FixMate.Application.Interfaces.Services;

public interface ITaxCalculationService
{
    Task<TaxCalculationResult> CalculateTaxAsync(TaxCalculationRequest request, CancellationToken ct = default);
    Task<GlobalTaxConfigDto> GetGlobalTaxConfigAsync(CancellationToken ct = default);
    Task<bool> UpdateGlobalTaxConfigAsync(GlobalTaxConfigDto dto, int? userId, string? userName, CancellationToken ct = default);
    Task<TaxReportSummaryDto> GetTaxReportSummaryAsync(DateTime? startDate, DateTime? endDate, int? serviceId, string? status, CancellationToken ct = default);
}
