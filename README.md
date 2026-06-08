# crossly.private.persistence.service

Express.js re-implementation of `crossly.persistence.service` (the .NET app): durable storage of
private cross-stitch **patterns**, mirroring its REST API, HATEOAS links, gzip transport and MongoDB
storage — but built on our standard service structure (controllers → managers → repository).

## Endpoints (mounted under `/api/v1/patterns`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | List HATEOAS links, one per stored pattern |
| GET | `/:id` | The pattern data model, gzip-compressed (`application/octet-stream`); `404`/`400` otherwise |
| POST | `/` | Create from a gzip body → `201` + `Location` + `{ link }`; `400` if invalid |
| PUT | `/:id` | Replace from a gzip body (matches id **and** name) → `200`/`404`; `400` if invalid |
| PATCH | `/:id/rename` | Rename via `{ newName }` → `200`/`404` |
| DELETE | `/:id` | Delete → `204`/`404` |

Plus `GET /health`.

## Storage

MongoDB `CrosslyDb` / `DataModels` (same as the .NET service, so it shares data). Override the
connection with `MONGO_URI` (default `mongodb://127.0.0.1:27017`). Pattern data models are stored as
structured documents with generated `ObjectId` ids; a `version` gate (`0.0.0.1`) guards the schema.

## Scripts

- `npm run build` — build contracts then the service
- `npm start` — build and run on port **5003**
- `npm test` — unit + integration tests (no database required; integration uses an in-memory repository)
- `npm run test:unit` / `npm run test:integration`

## License

Apache-2.0
