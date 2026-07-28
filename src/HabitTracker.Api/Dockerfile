FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/HabitTracker.Api/HabitTracker.Api.csproj", "src/HabitTracker.Api/"]
COPY ["src/HabitTracker.Application/HabitTracker.Application.csproj", "src/HabitTracker.Application/"]
COPY ["src/HabitTracker.Domain/HabitTracker.Domain.csproj", "src/HabitTracker.Domain/"]
COPY ["src/HabitTracker.Infrastructure/HabitTracker.Infrastructure.csproj", "src/HabitTracker.Infrastructure/"]

RUN dotnet restore "src/HabitTracker.Api/HabitTracker.Api.csproj"

COPY . .
WORKDIR "/src/src/HabitTracker.Api"
RUN dotnet publish "HabitTracker.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HabitTracker.Api.dll"]
