# Sales CRM — Hosting on GitHub + Saving to Google Sheets

Your dashboard now has two parts:

1. **`crm_dashboard.html`** — the page itself. Host this on GitHub Pages (free, static).
2. **`Code.gs`** — a tiny Google Apps Script that reads/writes your private Google Sheet. The page talks to it over HTTPS.

Everything still works with no setup (it falls back to saving in your browser). The Google Sheets sync turns on only once you paste in a URL + token. Do the two setups in this order.

---

## Part A — Google Sheets backend (do this first)

You need the script's URL before the page can sync, so set this up first.

1. Go to **https://sheets.google.com** and create a new blank spreadsheet. Name it anything (e.g. "Sales CRM Data").
2. In that sheet, open **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete whatever is in the editor, then paste in the **entire contents of `Code.gs`**.
4. Near the top, change this line to your own random string (any long phrase works):
   ```js
   var SECRET_TOKEN = "change-me-to-a-long-random-string";
   ```
   Keep a copy of what you chose — you'll paste the same value into the HTML in Part B.
5. Click **Save** (the disk icon).
6. Click **Deploy → New deployment**.
   - Click the gear next to "Select type" → choose **Web app**.
   - **Description:** anything (e.g. "CRM API").
   - **Execute as:** **Me**.
   - **Who has access:** **Anyone**.
     (This is safe: the script rejects every request that doesn't carry your secret token. "Anyone" only means "reachable on the internet," not "anyone can read your data.")
   - Click **Deploy**.
7. Google will ask you to **authorize**. Approve it. If you see "Google hasn't verified this app," click **Advanced → Go to (your project) → Allow** — this is normal for your own scripts.
8. Copy the **Web app URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb..................../exec
   ```
   Keep this URL — it goes into the HTML next.

> **If you ever change `Code.gs` later**, you must redeploy: **Deploy → Manage deployments → (edit / pencil) → Version: New version → Deploy**. The URL stays the same.

---

## Part B — Point the dashboard at your backend

1. Open **`crm_dashboard.html`** in a text editor.
2. Near the top of the `<script>` data section, find these two lines:
   ```js
   const SHEETS_API_URL = "";
   const SHEETS_API_TOKEN = "";
   ```
3. Fill them in with the URL from Part A step 8, and the token from Part A step 4:
   ```js
   const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycb...../exec";
   const SHEETS_API_TOKEN = "change-me-to-a-long-random-string";
   ```
4. Save the file.

That's it. When you open the page, the pill in the top-right will show:
- **● Local only** — no URL configured (browser-only saving)
- **● Connecting… / Synced / Saved to Sheets** — cloud sync working
- **● Offline — saved locally** — couldn't reach the script; your edits are kept locally and will sync next time it connects

The **⟳ Sync** button in the header force-reloads the latest data from the Sheet.

---

## Part C — Host on GitHub Pages

1. Create a GitHub repo (e.g. `sales-crm`). It can be public or private (private needs a paid plan for Pages).
2. Upload **`crm_dashboard.html`**. Renaming it to **`index.html`** means the site loads at the root URL with no filename needed (recommended).
3. In the repo: **Settings → Pages**.
   - **Source:** Deploy from a branch.
   - **Branch:** `main`, folder `/ (root)`. Save.
4. Wait ~1 minute. Your site appears at:
   ```
   https://YOUR-USERNAME.github.io/sales-crm/
   ```
5. Open it. The sync pill should reach **Synced**.

Do **not** upload `Code.gs` to GitHub Pages — it isn't used there. (It already lives inside your Google account.) It's fine to keep a copy in the repo for safekeeping; just know GitHub won't run it.

---

## How the data flows

- Every add/edit/delete saves to your browser **instantly**, then pushes to the Sheet about a second later (debounced, so rapid edits batch into one write).
- On page load, the dashboard shows your local copy immediately, then refreshes from the Sheet.
- The full dataset lives in cell **A1** of the `crm_data` tab as JSON (the source of truth). The script also mirrors a readable copy into `people`, `retailers`, and `touchpoints` tabs so you can browse it — but edits you type directly into those readable tabs are **not** read back by the app; always edit through the dashboard.
- **Export / Import JSON** buttons still work as a manual backup.

## A note on the token & privacy

- The token sits in the HTML, so anyone who can read your page source can see it. For a personal relationship tracker this is usually an acceptable trade-off. If the data is sensitive, host the page in a **private** repo, or put the page behind a login. The token still blocks casual/automated access to your Sheet.
- To rotate the token: change `SECRET_TOKEN` in Apps Script, redeploy (new version), and update `SHEETS_API_TOKEN` in the HTML to match.

## Troubleshooting

- **Pill stays "Connecting…" or shows "Offline":** the URL is wrong, the deployment access isn't "Anyone," or the token doesn't match. Re-check Part A steps 6 & 4.
- **Works locally but not on GitHub Pages:** make sure the URL is the `/exec` one (not `/dev`), and that you redeployed after any script change.
- **"unauthorized" in the browser console:** the token in the HTML doesn't match `SECRET_TOKEN` in the script.
