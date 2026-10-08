using AutoMapper;
using FixMate.Application.DTOs.Auth;
using FixMate.Domain.Entities;

namespace FixMate.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, opt => opt.MapFrom(s => s.Role.ToString()));

        CreateMap<Address, FixMate.Application.DTOs.Addresses.AddressDto>();
        CreateMap<FixMate.Application.DTOs.Addresses.CreateAddressDto, Address>();
        CreateMap<FixMate.Application.DTOs.Addresses.UpdateAddressDto, Address>();
    }
}

