using System.Security.Claims;
using HabitTracker.Application.Auth.Interfaces;

namespace HabitTracker.Api.Services;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid? UserId
    {
        get
        {
            var sub = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContextAccessor.HttpContext?.User.FindFirstValue("sub");

            return Guid.TryParse(sub, out var userId) ? userId : null;
        }
    }
}
