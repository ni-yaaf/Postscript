# POSTSCRIPT

*A place for words.*

> *"Some words deserve more than a comment."*

POSTSCRIPT is a private digital writing desk and public reading room designed for composing long, thoughtful letters in response to Reddit posts—and sharing published letters individually through clean, permanent links without accounts, subscriptions, databases, or paid servers.

---

## 1. What POSTSCRIPT Is

POSTSCRIPT separates two quiet spaces:

- **The Writing Desk (Private):** Stored locally in your browser (`localStorage`). Here you paste a Reddit post for reference, write long-form formatted letters, save favourite passages, organize themes, and manage drafts.
- **The Reading Room (Public):** A calm, distraction-free reading experience hosted for free on **GitHub Pages**. Only letters you explicitly package and commit to GitHub appear publicly.

Everything runs **100% free** with zero API keys, zero accounts, and zero paid services.

---

## 2. Required Software (For Running Locally)

If you want to run or build POSTSCRIPT on your own computer:

1. **Node.js (v18 or newer, v20 recommended):** Download from [nodejs.org](https://nodejs.org/).
2. **Git** (optional if you upload files directly on GitHub.com): Download from [git-scm.com](https://git-scm.com/).
3. A free **GitHub** account: [github.com](https://github.com/).

---

## 3. How to Run Locally

Open a terminal inside the project folder and run:

```bash
npm install
npm run dev
```

Then open the local URL printed in your terminal (usually `http://localhost:3000`).

---

## 4. How to Build

To verify the production static build locally:

```bash
npm run build
```

This creates the `dist/` folder containing the complete static website.

---

## 5. How to Create a GitHub Repository

1. Sign in to [github.com](https://github.com/).
2. Click the **+** icon in the top-right corner and choose **New repository**.
3. Name your repository `postscript` (or any name you prefer).
4. Set visibility to **Public** (GitHub Pages is free on public repositories).
5. Click **Create repository**.
6. Push or upload all project files into your new repository (including the `.github` workflow folder).

---

## 6. How to Deploy with GitHub Pages

This project already includes `.github/workflows/deploy.yml`, which builds and deploys automatically whenever you commit changes.

To enable GitHub Pages once:

1. Open your repository on GitHub.
2. Click **Settings** (top tab).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment → Source**, select **GitHub Actions**.
5. Wait 1–2 minutes for the first workflow run in the **Actions** tab to turn green.
6. Your Reading Room is now live at:
   `https://<your-username>.github.io/<your-repo-name>/`

> **Tip:** Bookmark `https://<your-username>.github.io/<your-repo-name>/#/desk` to open your private Writing Desk directly whenever you want to write!

---

## 7. How the Publishing Workflow Works

Because GitHub Pages is static hosting, visitors cannot write to your repository and your browser cannot push directly without credentials. Instead, POSTSCRIPT uses an honest, safe workflow:

**Compose → Save → Preview → Generate Package → Upload to GitHub → Share**

1. Your drafts live privately in your browser's `localStorage`.
2. When a letter is ready, you review its public preview inside POSTSCRIPT.
3. POSTSCRIPT creates a `.zip` package containing:
   - `public/data/letters.json` (the public letter index—never includes drafts or private passages)
   - `public/letters/<slug>/index.html` (an individual, shareable page for each published letter with link-preview metadata for Discord/Reddit)
4. You upload those files to GitHub and click **Commit changes**.
5. GitHub Actions rebuilds the site in ~60 seconds, and the letter goes live.

---

## 8. How to Publish a Letter

1. Open **New Letter** (or edit a saved draft).
2. Click **Preview & Publish**.
3. Review the letter preview and permanent URL, check the confirmation box, and click **Download Publication Package (.zip)**.
4. Unzip the downloaded file on your computer—you will see a `public` folder.
5. Open your repository on GitHub, click **Add file → Upload files**, drag the unzipped `public` folder into the upload area, and click **Commit changes**.
6. After ~1 minute, click **Verify Live Deployment** inside POSTSCRIPT (or visit the URL directly) and share the link!

---

## 9. How to Update a Published Letter

1. Open the letter from **Letters** and click **Edit**.
2. Make your edits (its URL slug stays locked so your original link never breaks).
3. Click **Preview & Publish → Download Publication Package (.zip)**.
4. Upload the unzipped `public` folder to GitHub and commit.

---

## 10. How to Unpublish a Letter

1. Open the letter in **Read View** and click **Unpublish**.
2. Confirm that you want to mark it unpublished.
3. Generate and download a new **Publication Package (.zip)** (available in **Settings** or from any letter's publish dialog) and upload `public/data/letters.json` to GitHub.
4. Check `PUBLISH_MANIFEST.txt` inside the `.zip`—if it lists an old folder like `public/letters/old-slug/`, delete that folder on GitHub as well so the direct page is removed.

---

## 11. How to Back Up Data

Your private drafts, saved passages, and settings live in your browser's storage. Clearing browser history/site data can erase them.

To back up everything safely:

1. Go to **Settings**.
2. Click **Export All Data (JSON)**.
3. Save the downloaded `postscript-backup-YYYY-MM-DD.json` file somewhere safe (e.g., an external folder or cloud drive).

---

## 12. How to Restore Data

To restore a backup on the same browser or a new computer:

1. Go to **Settings**.
2. Click **Import JSON Backup** and select your `.json` backup file.
3. Choose either:
   - **Merge with Existing** (adds missing letters without erasing your current drafts), or
   - **Replace All Local Data** (restores the exact state from the backup file).
