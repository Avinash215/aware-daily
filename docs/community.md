# Community and local news

Aware's shared features run on an Azure Functions API in `api/`. In
production it is a **separately deployed Flex Consumption Function App linked
to the Static Web App** ("bring your own functions"), because the
subscription's policy disables shared-key and public network access on
storage and managed functions support neither managed identity nor virtual
networks. Locally the same code runs under `func start` or the SWA CLI.
Everything else in the app stays static and browser-local. When the API is
absent (GitHub Pages, `npm run dev`), `/api/me` does not answer with JSON and
every community surface stays hidden.

| Feature | Endpoint | Storage |
| --- | --- | --- |
| Who am I, is community on | `GET /api/me` | none |
| Shared like counts for an edition | `GET /api/social/stats?edition=` | `awarestorystats`, `awareuserlikes` |
| Like / unlike (signed in) | `POST /api/social/like` | `awarelikes`, `awareuserlikes`, `awarestorystats` |
| Discussion | `GET, POST /api/social/comments` | `awarecomments` |
| Report a comment | `POST /api/social/report` | `awarecomments` |
| Readers' top stories, last 7 days | `GET /api/social/leaderboard` | `awarestorystats` |
| Moderation queue and actions | `GET, POST /api/social/moderation` | `awarecomments` |
| Local headlines for one reader's town | `POST /api/local` `{ place, country }` | none |

## Rules the API enforces

- Sign-in uses the Static Web Apps built-in providers (GitHub, Microsoft Entra
  ID). The API never trusts the browser for identity: behind the linked
  Function App it reads the `prn` claim of the Static Web Apps token that App
  Service has validated, and only when the platform-set principal ID matches
  the token (`api/src/lib/principal.js`); under managed functions it reads
  `x-ms-client-principal`. Direct calls to the Function App are refused.
- Comments from anyone but a moderator are **pending** until approved, and are
  visible only to their author until then. Moderators' comments publish at
  once. Readers can report visible comments; reported comments return to the
  queue.
- Moderators are users with the SWA `moderator` role, or anyone listed in the
  `AWARE_MODERATORS` app setting (`github:<handle>`, an email, or a user ID).
- Display names can never be an email address. GitHub handles are shown;
  other providers default to `Reader <id prefix>`.
- Writes require `Content-Type: application/json`, which a cross-site form
  cannot send without a preflight. Text is length-limited, control characters
  are stripped, and everything renders as plain text.
- Readers get 10 comments an hour, counted from stored comments so the limit
  holds across requests and instances.
- Local news: the reader's town travels in a POST body (never a URL, which
  platforms log), is used for one Google News RSS search, and is not stored,
  cached or logged by the API. Only headline, outlet, time and the original
  link are returned, labelled as not summarised or checked by Aware. The
  reader's own browser caches results for 20 minutes.


## App settings (on the Function App)

| Setting | Value |
| --- | --- |
| `AWARE_STORAGE_ACCOUNT` | Storage account holding the tables, reached with a managed identity (`awaredailycommunity`). |
| `AWARE_STORAGE_CLIENT_ID` | Client ID of the user-assigned identity `id-aware-api`. Without it, `DefaultAzureCredential` is used. |
| `AWARE_STORAGE_CONNECTION` | Local development only (Azurite). Takes precedence over the account name. |
| `AWARE_MODERATORS` | Comma list, e.g. `github:Avinash215`. |
| `AWARE_COMMUNITY` | `on` (everyone), `preview` (moderators only, a soft launch), or `off`. Unset means `on`; anything else means `off`. |

Without storage settings the community endpoints answer 503 and the UI hides
itself; local news still works. Static Web Apps' own app settings do not reach
a linked Function App.

## Run it locally

```powershell
npx azurite --location .azurite --skipApiVersionCheck --loose     # storage emulator
cd api; npm install; cd ..
npm run build
swa start dist --api-location api                                  # http://localhost:4280
```

`api/local.settings.json` (git-ignored) points the API at Azurite:

```json
{ "IsEncrypted": false, "Values": {
  "FUNCTIONS_WORKER_RUNTIME": "node",
  "AzureWebJobsStorage": "UseDevelopmentStorage=true",
  "AWARE_STORAGE_CONNECTION": "UseDevelopmentStorage=true",
  "AWARE_MODERATORS": "github:avinash215",
  "AWARE_COMMUNITY": "on" } }
```

The SWA CLI emulates sign-in at `/.auth/login/github`. Unit tests:
`cd api; npm test`.

## Production

All in `rg-aware-daily`, East US 2, tagged `app=aware-daily purpose=community`.
The layout follows Microsoft's `functions-quickstart-javascript-azd` sample
with `vnetEnabled`.

| Resource | Purpose |
| --- | --- |
| `vnet-aware-daily` 10.61.0.0/24 | `snet-pe` 10.61.0.0/26 for private endpoints; `snet-func` 10.61.0.64/27 delegated to `Microsoft.App/environments`, default outbound access on so local news can reach Google News. |
| `awaredailycommunity` | Tables (`aware*`) and the Function App's host and deployment storage (container `app-package`). Policy keeps shared keys and public network access off. |
| `pe-awaredailycommunity-blob`, `-table` | Private endpoints, with `privatelink.blob` and `privatelink.table` DNS zones linked to the VNet. |
| `id-aware-api` | User-assigned identity: Storage Blob Data Owner and Storage Table Data Contributor on the account, Monitoring Metrics Publisher on `appi-aware-api`. |
| `func-aware-daily-api` | Flex Consumption, Node 22, 512 MB, at most 10 instances, VNet-integrated. Host storage uses `AzureWebJobsStorage__credential=managedidentity`, `__clientId` and `__blobServiceUri`. |
| `appi-aware-api` | Application Insights on the existing workspace, local auth off. |

The Function App is linked to the Static Web App, so `/api/*` on the site is
proxied to it and linking adds an auth provider that turns away direct calls.
The daily job (`aware-daily-job`) runs with `AWARE_API_MODE=linked`, so its
`swa deploy` uploads the site only: Static Web Apps refuses a linked backend
while managed functions exist.

### Deploying API changes

The daily job does not deploy the API. After changing `api/`:

```powershell
cd api; npm ci; npm test
func azure functionapp publish func-aware-daily-api --javascript
```

### Opening community to readers

The soft launch runs with `AWARE_COMMUNITY=preview`: only moderators see the
features, with a notice on the You page. Sign in at
`https://green-ocean-07d95e00f.3.azurestaticapps.net/.auth/login/github`, then
open You. To open it to everyone:

```powershell
az functionapp config appsettings set -g rg-aware-daily -n func-aware-daily-api --settings AWARE_COMMUNITY=on
```

`off` closes it again at any time; stored likes and comments are kept.

### Rollback to managed functions

Unlink the backend (`az staticwebapp backends unlink --name aware-daily -g rg-aware-daily`),
remove `AWARE_API_MODE` from the job and re-run it: the next upload carries
`api/` as managed functions again, which serve local news; community stays
off because managed functions cannot reach this storage account.

## Cost

Verified with the Azure Retail Prices API on 2026-09-23 (list prices; your
agreement may differ):

- Private endpoints: $0.01 per hour each, two of them, about $14.60 a month,
  plus $0.01 per GB processed.
- Private DNS zones: $0.50 per zone per month, two zones.
- Flex Consumption on demand: the first 100,000 GB-seconds and 250,000
  executions a month are free, then $0.000026 per GB-second and $0.000004 per
  10 executions. A personal site stays inside the free grant.
- Table Storage (Standard LRS): $0.045 per GB-month and $0.00036 per 10,000
  operations (checked 2026-09-22).
- Log Analytics: the first 5 GB a month are free, then $2.76 per GB.

Expect roughly $16 a month, almost all of it the two private endpoints.
