# Community and local news

Aware's shared features run on the Azure Static Web Apps **managed Functions
API** in `api/`. Everything else in the app stays static and browser-local.
When the API is absent (GitHub Pages, `npm run dev`), `/api/me` does not
answer with JSON and every community surface stays hidden.

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
  ID). The API reads the `x-ms-client-principal` header and never trusts the
  browser for identity.
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

## App settings

| Setting | Value |
| --- | --- |
| `AWARE_STORAGE_CONNECTION` | Connection string of the storage account holding the tables. Without it the community endpoints answer 503 and the UI hides itself; local news still works. |
| `AWARE_MODERATORS` | Comma list, e.g. `github:Avinash215`. |

The Node runtime comes from `public/staticwebapp.config.json`
(`platform.apiRuntime = node:22`).

## Run it locally

```powershell
npx azurite --location .azurite --silent --skipApiVersionCheck   # storage emulator
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
  "AWARE_MODERATORS": "github:avinash215" } }
```

The SWA CLI emulates sign-in at `/.auth/login/github`. Unit tests:
`cd api; npm test`.

## Going live (needs the owner's approval: new resource, push and deploy)

The published site comes from the `aware-daily-job` container image, which
clones this repo's `main` from GitHub at build time, and the daily run replaces
the whole site with `swa deploy`. So the API only survives the next daily run
if it is inside the image. The pipeline's `entrypoint.py` now passes
`--api-location` whenever `api/package.json` exists, and its `Dockerfile`
installs the API's production dependencies.

```powershell
$SUB = "c0d9f6ea-0bc0-4857-a1d2-c2fe5b4cb852"; $RG = "rg-aware-daily"; $LOC = "eastus2"
$SA  = "awaredailycommunity"                     # globally unique; change if taken
az account set --subscription $SUB

# 1. Storage for the community tables.
az storage account create --name $SA --resource-group $RG --location $LOC --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 --allow-blob-public-access false

# 2. App settings on the Static Web App. The connection string is read and set in one
#    pipeline so it never lands in a file or the shell history.
az staticwebapp appsettings set --name aware-daily --resource-group $RG --setting-names "AWARE_STORAGE_CONNECTION=$(az storage account show-connection-string --name $SA --resource-group $RG --query connectionString -o tsv)" "AWARE_MODERATORS=github:Avinash215"

# 3. Publish the frontend + API source the image clones.
cd C:/Users/avinashswami/scout/aware-daily; git push origin main

# 4. Rebuild the job image (see aware-local/docs/azure-job.md section 4) and point the job at it.
cd C:/Users/avinashswami/scout/aware-local
az acr build --registry <acr> --resource-group $RG --image "aware-daily-job:<tag>" --image "aware-daily-job:latest" --file Dockerfile .
az containerapp job update --name aware-daily-job --resource-group $RG --image "<acr>.azurecr.io/aware-daily-job:<tag>"

# 5. Run it once and check.
az containerapp job start --name aware-daily-job --resource-group $RG
```

Then sign in on the live site with GitHub as the moderator, like a story,
comment, and open You, then Moderation. Roll back by pointing the job at the
previous image tag (azure-job.md section 8); the app settings and tables can
stay.

Cost: the Static Web App is already on the Standard plan, which includes the
managed API. Table Storage (Standard LRS, East US 2, Azure Retail Prices API,
checked 2026-09-22) is $0.045 per GB-month and $0.00036 per 10,000
operations, so a personal-scale community costs cents a month. Prices vary by
agreement; check the portal.
