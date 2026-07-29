# HabitTracker

Backend API (.NET 8) and mobile app (Expo/React Native) for tracking habits and streaks.

## Check-in dates

Check-in and undo endpoints use the **client-provided local date** (`YYYY-MM-DD`), not the server's calendar day.

- `POST /api/v1/habits/{id}/checkins` — body: `{ "date": "YYYY-MM-DD" }`
- `DELETE /api/v1/habits/{id}/checkins/{date}`

The mobile app sends the device's local date via `getLocalDateString()`. The server validates that the date:

1. Is not before the habit's creation date.
2. Is within ±1 day of the server's UTC date (timezone tolerance).

`CompletedAt` is stored as the real UTC timestamp when the check-in was recorded.

## Development

```bash
# Backend
dotnet run --project src/HabitTracker.Api

# Mobile
cd mobile && npm start
```
