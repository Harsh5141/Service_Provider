using System.Security.Claims;
using AutoMapper;
using FixMate.Application.Common;
using FixMate.Application.DTOs.Addresses;
using FixMate.Application.Interfaces.Repositories;
using FixMate.Application.Interfaces.Services;
using FixMate.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AddressesController : ControllerBase
{
    private readonly IAddressRepository _addressRepo;
    private readonly IGeoLocationService _geoLocationService;
    private readonly IMapper _mapper;

    public AddressesController(
        IAddressRepository addressRepo,
        IGeoLocationService geoLocationService,
        IMapper mapper)
    {
        _addressRepo = addressRepo;
        _geoLocationService = geoLocationService;
        _mapper = mapper;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AddressDto>>>> GetMyAddresses(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(ApiResponse<List<AddressDto>>.Fail("Unauthorized user", 401));

        var addresses = await _addressRepo.GetByUserIdAsync(userId, ct);
        var dtos = _mapper.Map<List<AddressDto>>(addresses);
        return Ok(ApiResponse<List<AddressDto>>.Ok(dtos, "Addresses retrieved successfully"));
    }

    [HttpGet("default")]
    public async Task<ActionResult<ApiResponse<AddressDto?>>> GetDefaultAddress(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(ApiResponse<AddressDto?>.Fail("Unauthorized user", 401));

        var address = await _addressRepo.GetDefaultByUserIdAsync(userId, ct);
        var dto = address != null ? _mapper.Map<AddressDto>(address) : null;
        return Ok(ApiResponse<AddressDto?>.Ok(dto, "Default address retrieved"));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AddressDto>>> GetAddressById(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(ApiResponse<AddressDto>.Fail("Unauthorized user", 401));

        var address = await _addressRepo.GetByIdAsync(id, userId, ct);
        if (address == null)
        {
            return NotFound(ApiResponse<AddressDto>.Fail("Address not found", 404));
        }

        var dto = _mapper.Map<AddressDto>(address);
        return Ok(ApiResponse<AddressDto>.Ok(dto, "Address retrieved"));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AddressDto>>> CreateAddress([FromBody] CreateAddressDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(ApiResponse<AddressDto>.Fail("Unauthorized user", 401));

        if (string.IsNullOrWhiteSpace(dto.Street) || string.IsNullOrWhiteSpace(dto.State) || string.IsNullOrWhiteSpace(dto.PostalCode))
        {
            return BadRequest(ApiResponse<AddressDto>.Fail("Address line, State, and 6-digit PIN code are required.", 400));
        }

        // Validate PIN code against State and resolve City automatically
        var lookup = await _geoLocationService.LookupPostalCodeAsync(dto.PostalCode, dto.State, ct);
        if (!lookup.IsValid)
        {
            return BadRequest(ApiResponse<AddressDto>.Fail(lookup.ErrorMessage ?? "PIN Code does not belong to the selected State", 400));
        }

        var entity = new Address
        {
            UserId = userId,
            Label = string.IsNullOrWhiteSpace(dto.Label) ? "Home" : dto.Label.Trim(),
            Street = dto.Street.Trim(),
            City = lookup.City,
            State = lookup.State,
            PostalCode = lookup.PostalCode,
            Latitude = lookup.Latitude ?? dto.Latitude,
            Longitude = lookup.Longitude ?? dto.Longitude,
            IsDefault = dto.IsDefault,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _addressRepo.AddAsync(entity, ct);
        var resultDto = _mapper.Map<AddressDto>(created);

        return CreatedAtAction(nameof(GetAddressById), new { id = created.Id },
            ApiResponse<AddressDto>.Ok(resultDto, "Address added successfully", 201));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<AddressDto>>> UpdateAddress(int id, [FromBody] UpdateAddressDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(ApiResponse<AddressDto>.Fail("Unauthorized user", 401));

        var existing = await _addressRepo.GetByIdAsync(id, userId, ct);
        if (existing == null)
        {
            return NotFound(ApiResponse<AddressDto>.Fail("Address not found", 404));
        }

        // Validate PIN code against State and resolve City automatically
        var lookup = await _geoLocationService.LookupPostalCodeAsync(dto.PostalCode, dto.State, ct);
        if (!lookup.IsValid)
        {
            return BadRequest(ApiResponse<AddressDto>.Fail(lookup.ErrorMessage ?? "PIN Code does not belong to the selected State", 400));
        }

        existing.Label = string.IsNullOrWhiteSpace(dto.Label) ? existing.Label : dto.Label.Trim();
        existing.Street = dto.Street.Trim();
        existing.City = lookup.City;
        existing.State = lookup.State;
        existing.PostalCode = lookup.PostalCode;
        existing.Latitude = lookup.Latitude ?? dto.Latitude;
        existing.Longitude = lookup.Longitude ?? dto.Longitude;
        existing.IsDefault = dto.IsDefault;

        await _addressRepo.UpdateAsync(existing, ct);
        var resultDto = _mapper.Map<AddressDto>(existing);

        return Ok(ApiResponse<AddressDto>.Ok(resultDto, "Address updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteAddress(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(ApiResponse<bool>.Fail("Unauthorized user", 401));

        var existing = await _addressRepo.GetByIdAsync(id, userId, ct);
        if (existing == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Address not found", 404));
        }

        await _addressRepo.DeleteAsync(existing, ct);
        return Ok(ApiResponse<bool>.Ok(true, "Address deleted successfully"));
    }

    [HttpPut("{id}/default")]
    public async Task<ActionResult<ApiResponse<bool>>> SetDefaultAddress(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(ApiResponse<bool>.Fail("Unauthorized user", 401));

        var existing = await _addressRepo.GetByIdAsync(id, userId, ct);
        if (existing == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Address not found", 404));
        }

        await _addressRepo.SetDefaultAddressAsync(id, userId, ct);
        return Ok(ApiResponse<bool>.Ok(true, "Default address set successfully"));
    }
}
