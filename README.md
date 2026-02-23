# OneNote Web Extractor

Extract content from Microsoft OneNote view-only web links using Playwright automation.

## Purpose

This tool helps you extract **your own data** from OneNote notebooks when:
- You have view-only access to a shared notebook
- You want to migrate content to another format (Markdown, Obsidian, etc.)
- OneNote's export options are limited or unavailable

## Disclaimer

This tool is for **personal use with your own data or data you have permission to access**. 

- ✅ Use it to extract your own notebooks
- ✅ Use it with permission from the notebook owner
- ❌ Do not use it to scrape content you don't have rights to access
- ⚠️ Check Microsoft's Terms of Service for your use case

This is a personal data liberation tool, not a mass scraping tool.

## The Technical Problem

OneNote Web uses JavaScript-heavy architecture that rejects programmatic automation:

1. **Event trust checking**: `element.click()` generates `isTrusted: false` events
2. **Async iframe loading**: Content loads in separate frames after navigation
3. **State management**: React/Vue-like state that doesn't respond to synthetic events

## The Solution

Uses **Playwright's native interactions** which generate browser-level events identical to real user clicks:

```javascript
// ❌ Doesn't work (untrusted synthetic event)
await page.evaluate(() => document.querySelector('.page').click());

// ✅ Works (trusted browser event)
await page.locator('.page').click();
```

## Installation

```bash
npm install
npx playwright install chromium
```

## Usage

### Basic Usage

1. **Get your OneNote view-only link**
   - Open OneNote Web
   - Share → Get link → View only
   - Copy the link (looks like `https://1drv.ms/o/c/...`)

2. **Create a config file** (`my-notebook.json`):

```json
{
  "notebookUrl": "https://1drv.ms/o/c/your-link-here/...",
  "outputDir": "./output",
  "sections": [
    {
      "name": "My Section",
      "pages": ["Page 1", "Page 2", "Page 3"]
    }
  ]
}
```

3. **Run extraction**:

```bash
node extract.js my-notebook.json
```

4. **Find your extracted content**:

```
output/
└── my-section/
    ├── page-1.md
    ├── page-2.md
    └── page-3.md
```

### Getting Section and Page Names

**Option 1: Manual inspection**
1. Open your OneNote link in a browser
2. Click through sections to see page names
3. Add them to your config file

**Option 2: Use the explorer script** (TODO: build this)

## How It Works

```
1. Load notebook URL
   ↓
2. Wait for JavaScript to initialize
   ↓
3. Click section (native Playwright click)
   ↓
4. Wait for page list to populate
   ↓
5. Click page (native Playwright click)
   ↓
6. Wait for iframe content to load
   ↓
7. Extract text from onenoteframe.aspx iframe
   ↓
8. Save to markdown file
```

## Architecture

**Container-based extraction:**

1. **Notebook container** → Sections
2. **Section container** → Pages  
3. **Page container** → Content (in iframe)

The key is using **trusted browser events** at each navigation step so OneNote's JavaScript responds correctly.

## Configuration Format

```json
{
  "notebookUrl": "string",     // Required: OneNote view-only link
  "outputDir": "string",       // Required: Where to save files
  "sections": [                // Required: Array of sections
    {
      "name": "string",        // Required: Exact section name
      "pages": ["string"]      // Required: Exact page names
    }
  ]
}
```

## Limitations

- **Text only**: Extracts text content, not images or formatting
- **View-only links**: Doesn't handle authentication (use Microsoft Graph API for that)
- **Exact matches**: Page names must match exactly (case-sensitive)
- **Speed**: ~2-3 seconds per page (waits for async loading)
- **No recursive discovery**: You must specify section/page names manually

## Advanced: Understanding the DOM

OneNote Web structure:
```
Main frame
├── Navigation iframe
│   └── [role="treeitem"] (sections)
│       └── .pageNode (pages)
│           └── .pageListItem (clickable)
└── Content iframe (onenoteframe.aspx)
    └── [contenteditable] or body (content)
```

## Troubleshooting

**"Could not find page"**
- Check spelling (case-sensitive)
- Page might be nested in a sub-section
- Try waiting longer (increase `waitForTimeout`)

**"No content extracted"**
- OneNote might have changed iframe structure
- Check browser console for errors
- Try with `headless: false` to debug visually

**Timeout errors**
- Increase timeout in `page.goto()`
- Check your internet connection
- OneNote service might be slow

## Why This Approach?

**Alternatives considered:**

1. **Microsoft Graph API**: Requires OAuth, app registration, complex setup
2. **evaluate().click()**: Generates untrusted events, doesn't work
3. **PDF export**: Loses structure, hard to parse
4. **HTML export**: Not available for view-only links

**This approach:**
- ✅ Works with view-only links
- ✅ No authentication needed (if link is public)
- ✅ Generates trusted events
- ✅ Extracts text cleanly

## Legal & Ethical Use

**Appropriate uses:**
- Backing up your own notebooks
- Migrating your data to another platform
- Extracting content you created or have permission to access

**Inappropriate uses:**
- Scraping content you don't have rights to
- Bypassing access controls
- Mass data collection
- Any use that violates Microsoft's Terms of Service

**When in doubt:** Use Microsoft's official export features or Graph API instead.

## Contributing

PRs welcome! Areas for improvement:

- [ ] Auto-discovery of sections/pages
- [ ] Image extraction
- [ ] Formatting preservation (Markdown bold, italics, etc.)
- [ ] Progress bars
- [ ] Parallel extraction
- [ ] Resume on failure

## License

MIT

## Acknowledgments

Built through systematic debugging of OneNote Web's event handling. The key insight: modern web apps check `event.isTrusted` to distinguish real users from automation.
