# FastCite (Google Docs Add-on MVP)

FastCite is a Google Docs add-on that lets you paste a DOI/PMID/URL, insert a placeholder instantly, and update citations plus a bibliography in AMA-like numeric format.

## Features

- **Quick Cite**: Paste DOI/PMID/URL → insert `{{FASTCITE:ref_id}}` placeholder immediately.
- **Auto-library**: References are stored in your Google Drive in `FastCite/fastcite_library.json`.
- **Update citations & bibliography**: One click converts placeholders to `[n]` and regenerates a managed bibliography block.

## Install in Google Docs (Test Deployment)

1. Open [script.new](https://script.new) in your browser.
2. Rename the project to `FastCite`.
3. Replace the default `Code.gs` with the files in this repo:
   - `Code.gs`
   - `Cite.gs`
   - `Library.gs`
   - `Metadata.gs`
   - `Update.gs`
   - `Format.gs`
   - `Tests.gs`
   - `Sidebar.html`
   - `Sidebar.js.html`
   - `appsscript.json`
4. In the Apps Script editor, open **Project Settings** and enable the **Show "appsscript.json" manifest file in editor** if it isn't already.
5. Save the project.
6. Click **Deploy → Test deployments**.
7. Choose **Select type → Add-on**.
8. Select **Docs** as the host app and deploy.
9. Open a Google Doc, then go to **Extensions → Add-ons → Test deployments** and select **FastCite**.
10. The sidebar should open. If not, refresh and use **Extensions → FastCite → Open FastCite**.

## How to Use

1. **Quick Cite**
   - Paste a DOI/PMID/URL in the Quick Cite bar.
   - Press **Enter** or click **Cite**.
   - A placeholder is inserted instantly in the document.
   - Metadata fetch runs in the background and updates the library.

2. **Update citations & bibliography**
   - Go to the **Document** tab.
   - Click **Update citations & bibliography**.
   - Placeholders are replaced with bracketed citations `[n]`.
   - A bibliography block is (re)generated at the end with markers:
     ```
     {{FASTCITE:BIB_START}}
     ...
     {{FASTCITE:BIB_END}}
     ```

3. **Library**
   - Search your library by title, author, DOI, PMID, or URL.
   - Click **Cite** to insert the placeholder again.

4. **Settings**
   - Update the bibliography heading (default: `References`).

## Troubleshooting

- **Metadata fetch fails**: The citation placeholder remains. The issue appears in the Quick Cite tab.
- **Library reset**: If the JSON file is corrupted, a fresh library is created automatically.

## Running Tests

From the Apps Script editor, run `runAllTests()` in `Tests.gs`. Check logs for PASS/FAIL.
