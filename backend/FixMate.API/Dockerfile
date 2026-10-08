# ── FixMate API Docker image ───────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files first for layer caching
COPY ["FixMate.API/FixMate.API.csproj",             "FixMate.API/"]
COPY ["FixMate.Application/FixMate.Application.csproj", "FixMate.Application/"]
COPY ["FixMate.Domain/FixMate.Domain.csproj",       "FixMate.Domain/"]
COPY ["FixMate.Infrastructure/FixMate.Infrastructure.csproj", "FixMate.Infrastructure/"]

RUN dotnet restore "FixMate.API/FixMate.API.csproj"

COPY . .
WORKDIR "/src/FixMate.API"
RUN dotnet build "FixMate.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FixMate.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FixMate.API.dll"]
