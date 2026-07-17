# git-vault — media storage on GitHub

Turn any GitHub repository into a media bucket. Sign in with GitHub, pick or
create a repo, drag files in, browse them in a gallery, and copy permanent links
into your site.

## Setup

**1. Create a GitHub OAuth app** at <https://github.com/settings/developers> →
_New OAuth App_:

| Field                      | Value                                            |
| -------------------------- | ------------------------------------------------ |
| Homepage URL               | `http://localhost:3000`                          |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

**2. Configure the environment:**

```bash
cp .env.example .env.local
npx auth secret          # writes AUTH_SECRET
```

Paste your client ID and secret into `.env.local` as `AUTH_GITHUB_ID` and
`AUTH_GITHUB_SECRET`.

**3. Run it:**

```bash
npm install
npm run dev
```

## Features

- **Buckets** — use any existing repo, or create one from the sidebar (public or
  private, your choice at creation time)
- **Branches** — switch branches from the toolbar; every read and write targets
  the selected branch
- **Folders** — create, navigate, delete recursively; drag a file onto a folder
  or a breadcrumb to move it
- **Any file** — images, video, audio, PDF inline; source/text/JSON/CSV in a
  code viewer; Office docs via an external viewer (public repos only)
- **Auto-compression** — oversized images are re-encoded client-side to fit
- **Themes** — light by default, dark on toggle, remembered per browser

## How it works

The app stores nothing itself — every action is a GitHub API call made with your
OAuth token.

| Action        | GitHub API                                    |
| ------------- | --------------------------------------------- |
| Browse        | `GET /repos/{o}/{r}/contents/{path}?ref=`     |
| Upload        | `PUT /repos/{o}/{r}/contents/{path}` (base64) |
| Delete file   | `DELETE /repos/{o}/{r}/contents/{path}`       |
| Delete folder | Git Data API — one commit for the whole tree  |
| Move / rename | Git Data API — one commit, blob re-pathed     |
| Download      | Blobs API (private) or raw CDN (public)       |

Uploads and deletes are ordinary commits, so the full history stays in the repo.

### Public vs private repos

The one real branch in the design, handled in [`app/api/media/route.ts`](app/api/media/route.ts):

- **Public** — files come straight from `raw.githubusercontent.com`. Fast, free,
  no server in the path. These are the links worth embedding in a website.
- **Private** — no public URL exists, so bytes stream through
  [`app/api/raw/route.ts`](app/api/raw/route.ts) with your token attached. Links
  only resolve for a signed-in session, and every view costs an API call.

### Folders are a git fiction

Git can't represent an empty directory. Creating a folder commits a hidden
`.gitkeep` inside it, which the UI filters out of listings.

## Limits

Surfaced in-app too — the ⓘ button in the toolbar shows live storage and API
meters, and warns before you hit a wall.

| Limit                   | Value                 | Notes                                        |
| ----------------------- | --------------------- | -------------------------------------------- |
| File size               | **95 MB**             | GitHub hard-caps blobs at 100 MB             |
| Oversized images        | auto-compressed       | re-encoded to WebP/JPEG until they fit       |
| Oversized video/GIF/zip | **rejected**          | see below                                    |
| Repo size               | 1 GB soft / 5 GB hard | GitHub emails you past 1 GB                  |
| API requests            | 5,000/hour            | shared across your token; public views are free |
| Private-repo links      | signed-in only        | can't be embedded in a public site           |

### Worked around

- **Host body limits** — uploads go browser→GitHub directly
  ([`lib/upload-direct.ts`](lib/upload-direct.ts)), so Vercel's 4.5 MB function
  cap never applies. The ceiling is GitHub's, wherever you deploy.
- **Private video seeking** — [`app/api/raw/route.ts`](app/api/raw/route.ts)
  implements real `206` Range responses over a cached blob, since GitHub's Blobs
  API has no Range support of its own.

### Not fixable here

- **Private files can't be embedded publicly.** No public URL exists for them —
  that's GitHub, not a gap in this app. Use a public bucket for site assets.
- **Video isn't compressed.** In-browser transcoding needs ffmpeg.wasm (~30 MB,
  slower than realtime). Shrink video before uploading.
- GitHub's terms ask that repos not be used as a general-purpose CDN. Fine for a
  portfolio; use S3, R2, or Cloudinary if this needs to scale.

## Security note

Because uploads go browser-direct, the OAuth token reaches the client. It's the
signed-in user's own token and never leaves their session, but it does mean an
XSS bug would expose repo access. Worth knowing if you extend this.

## Deploying

Deploys anywhere Next.js runs, Vercel included — the upload path no longer cares
about serverless body limits.

Set `AUTH_URL` to your deployed origin and add a second OAuth callback URL for it.
# git-vault
