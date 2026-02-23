# OneNote Web Extractor

Extract individual pages from Microsoft OneNote view-only web links using Playwright.

## The Problem

OneNote Web's JavaScript-heavy interface makes it difficult to programmatically extract content from individual pages. Traditional web scraping approaches fail because:

1. **Synthetic clicks are rejected**: `element.click()` generates `isTrusted: false` events that OneNote ignores
2. **Complex state management**: Page content loads asynchronously in iframes after navigation
3. **Event chain requirements**: Real user interactions trigger `mousedown → focus → mouseup → click`

## The Solution

This tool uses **Playwright's native click** (`locator.click()`) which:
- ✅ Generates `isTrusted: true` events (like real user clicks)
- ✅ Includes proper mouse coordinates
- ✅ Triggers the full event chain
- ✅ Waits for elements to be actionable

## Installation

```bash
npm install
npx playwright install chromium
```

## Usage

### 1. Create a config file

```json
{
  "notebookUrl": "https://1drv.ms/o/c/your-notebook-id/...",
  "outputDir": "./output",
  "sections": [
    {
      "name": "Section Name",
      "pages": [
        "Page 1",
        "Page 2",
        "Page 3"
      ]
    }
  ]
}
```

### 2. Run the extractor

```bash
node extract.js config.json
```

### 3. Find your extracted pages

```
output/
├── section-name/
│   ├── page-1.md
│   ├── page-2.md
│   └── page-3.md
```

## Example Config

See `example-config.json` for a complete example.

## How It Works

1. **Loads the notebook**: Opens the OneNote web URL
2. **Native section click**: Uses Playwright's `locator.click()` to click the section
3. **Native page click**: Uses Playwright's `locator.click()` to click individual pages
4. **Wait for content**: Gives OneNote time to load the page in its iframe
5. **Extract from iframe**: Finds the `onenoteframe.aspx` iframe and extracts text
6. **Save to markdown**: Writes content to `.md` files

## Key Insight

**Always use Playwright's native click** (`locator.click()`) instead of `evaluate().click()` when dealing with modern web apps that check `event.isTrusted`.

```javascript
// ❌ This doesn't work (isTrusted: false)
await page.evaluate(() => {
  document.querySelector('.element').click();
});

// ✅ This works (isTrusted: true)
await page.locator('.element').click();
```

## Limitations

- Requires **view-only links** (doesn't handle authentication)
- Extracts **text content only** (no images, formatting)
- Needs page names to be exact matches
- Takes time (~2-3 seconds per page due to load waits)

## License

MIT

## Contributing

PRs welcome! This tool was built through systematic debugging of OneNote Web's JavaScript state management.

## Acknowledgments

Built while extracting work documentation for a career timeline blog post. The debugging process itself became the product.
