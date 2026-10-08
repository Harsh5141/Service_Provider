using FixMate.Application.Common;
using FixMate.Application.DTOs.Locations;
using FixMate.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly IGeoLocationService _geoLocationService;

    public LocationsController(IGeoLocationService geoLocationService)
    {
        _geoLocationService = geoLocationService;
    }

    /// <summary>
    /// Returns the complete list of Indian States and Union Territories for dropdown selection.
    /// </summary>
    [HttpGet("states")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<IReadOnlyList<string>>> GetStates()
    {
        var states = IndianStatesData.AllStatesAndUTs;
        return Ok(ApiResponse<IReadOnlyList<string>>.Ok(states, "Indian States and UTs retrieved successfully"));
    }

    /// <summary>
    /// Looks up an Indian 6-digit PIN code, validates against selected State, and returns the auto-detected City/District.
    /// </summary>
    [HttpGet("lookup-pin")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PinLookupResponseDto>>> LookupPinCode(
        [FromQuery] string postalCode,
        [FromQuery] string? state = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(postalCode))
        {
            return BadRequest(ApiResponse<PinLookupResponseDto>.Fail("PIN Code is required", 400));
        }

        var result = await _geoLocationService.LookupPostalCodeAsync(postalCode, state, ct);

        if (!result.IsValid)
        {
            return BadRequest(ApiResponse<PinLookupResponseDto>.Fail(
                result.ErrorMessage ?? "Invalid PIN Code or PIN does not belong to the selected State",
                400,
                new List<string> { result.ErrorMessage ?? "Invalid PIN Code" }));
        }

        return Ok(ApiResponse<PinLookupResponseDto>.Ok(result, "PIN Code validated and City resolved successfully"));
    }
}
