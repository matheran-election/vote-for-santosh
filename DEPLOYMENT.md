# Deployment Guide - VoteForSantosh.com (Static)

The project no longer relies on Node.js or server-side storage. All vote data is persisted in the visitor's browser via `localStorage`, so the entire site can be hosted as static files.

---

## Recommended Free Hosting Options

### 1. GitHub Pages
1. Initialize git and push this folder to a GitHub repository.
2. In the repository settings, enable **Pages** → **Deploy from branch** → choose `main` and `/root`.
3. GitHub provides a public URL such as `https://username.github.io/VoteForSantosh.com/`.

### 2. Netlify
1. Sign up at https://www.netlify.com (free tier).
2. Click **Add new site → Deploy manually** or **Import from Git**.
3. Drag-and-drop the project folder or select your GitHub repo.
4. Netlify assigns a free HTTPS domain (custom domain support included).

### 3. Vercel
1. Sign up at https://vercel.com (free tier).
2. **Add New Project → Import Git Repository**.
3. No build command needed; select the root directory and deploy.
4. Vercel provides a `*.vercel.app` URL with HTTPS.

Any static hosting provider (Cloudflare Pages, Surge, Render Static Sites, etc.) will work because there is no server process.

---

## Local Preview

Since there is no Node dependency, you can open `index.html` directly in a browser. For accurate `localStorage` isolation between pages, use a lightweight static server:

```powershell
# Option A: Python 3
python -m http.server 3000

# Option B: VS Code Live Server extension
```

Then visit `http://localhost:3000/` for the voting UI and `http://localhost:3000/admini.html` for the admin dashboard.

---

## Limitations Without a Backend

- Vote counts live in each visitor's browser only. Different devices or browsers will not share totals.
- Clearing browser data (cache/storage) resets the counts.
- For centralized, tamper-resistant totals you will eventually need a backend service or hosted database.

---

## Deployment Checklist

1. Remove old Node-specific files if they still exist (`server.js`, `package*.json`, `votes.json`, `node_modules/`).
2. Commit the current static assets (`index.html`, `admini.html`, `script.js`, `styles.css`, `Lotus.png`, `.gitignore`, `DEPLOYMENT.md`).
3. Push to your Git hosting provider.
4. Deploy using one of the static hosting options above.

Once deployed, share the generated public URL (e.g., `https://voteforsantosh.netlify.app`) with voters and admins. The admin dashboard remains accessible at `/admini.html` on the same domain.

