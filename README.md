# Event Horizon Solo

Event Horizon helps an event coordinator review a proposed catering delay and find real vendors near the event. The dashboard uses a synthetic reception in Brooklyn as its starting point.

## Run locally

Requires Node.js 22.18 or later.

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The app runs locally with a labeled demo report with no API key required for schedule review.

### Optional live integrations

Copy `.env.example` to `.env.local` and restart the development server after editing it.

- `ANTHROPIC_API_KEY` enables one server-side Claude Opus 4.6 request per analysis. The key stays on the server. A missing key enables the rule-based demo. A failed Claude request shows an error and blocks approval.
- `GOOGLE_PLACES_API_KEY` enables the live vendor list. Enable [Places API (New)](https://developers.google.com/maps/documentation/places/web-service/get-api-key) with billing and restrict the key to that API. Keep it server-side in `.env.local`. Text Search Pro billing applies to the business name and address fields.

## Demo

1. Analyze a 16:00 arrival. Setup finishes at 17:30, before the 18:00 doors.
2. Analyze a 17:00 arrival. Setup finishes at 18:30, 30 minutes after doors open. Review the two catering-dependent tasks and approve or reject the proposal. Approval saves the new arrival for this browser tab’s session.
3. Try the unknown setup duration option. The report flags the missing detail, leaves setup finish, overlap, and affected tasks unknown, and keeps approval unavailable.
4. Under **Vendor finder**, choose a category, enter a city, ZIP code, or venue address, and select **Find vendors**. Review up to 10 listings on the dashboard. Select **Show more** when available to load the next 10.

## Vendor Calendar

Open **Vendor calendar** to browse confirmed bookings and proposed future slots for the sample event. Drag a booking onto an hour or a listed date, or use **Move booking** for an exact `HH:MM` time on any date. Review the proposed move and any conflicts, then confirm or cancel. Confirmed changes are saved for the current browser tab and update the catering arrival shown in **Event Readiness**.

## Checks

```sh
npm test
npm run build
```
