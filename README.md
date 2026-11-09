# Event Horizon Solo

Event Horizon helps an event coordinator review a proposed catering delay and find real vendors near the event. The dashboard uses a synthetic reception in Brooklyn as its starting point.

## Run locally

Requires Node.js 22.18 or later.

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The app runs locally with a labeled demo report and a live Google Maps search link, with no API keys required.

### Optional live integrations

Copy `.env.example` to `.env.local` and restart the development server after editing it.

- `ANTHROPIC_API_KEY` enables one server-side Claude Opus 4.6 request per analysis. The key stays on the server. A missing key enables the rule-based demo. A failed Claude request shows an error and blocks approval.
- `GOOGLE_MAPS_EMBED_KEY` enables the interactive search map directly on the dashboard. Enable the [Maps Embed API](https://developers.google.com/maps/documentation/embed/get-api-key) and restrict the browser-visible key to that API and your website origins. The Google Maps results link works independently of the embed. Set the key before building a production copy.

## Demo

1. Analyze a 4 PM arrival. Setup finishes at 5:30 PM, before the 6 PM doors.
2. Analyze a 5 PM arrival. Setup finishes at 6:30 PM, 30 minutes after doors open. Review the two catering-dependent tasks and approve or reject the proposal. Approval saves the new arrival for this browser tab’s session.
3. Try the unknown setup duration option. The report flags the missing detail and leaves setup finish and overlap unknown.
4. Under **Vendor finder**, choose a category, enter a city, ZIP code, or venue address, and select **Find vendors**. Open the live results in Google Maps or browse the embedded map when configured.

## Checks

```sh
npm test
npm run build
```
