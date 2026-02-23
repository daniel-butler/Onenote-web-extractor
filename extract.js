#!/usr/bin/env node
/**
 * OneNote Batch Page Extractor
 * Extracts all pages from specified sections using native Playwright clicks
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function extractAllPages(notebookUrl, sectionsConfig, outputDir) {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.error('Loading notebook...');
  await page.goto(notebookUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(12000);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Process each section
  for (const section of sectionsConfig) {
    const sectionName = section.name;
    const sectionDir = path.join(outputDir, sectionName.toLowerCase().replace(/\s+/g, '-'));
    
    if (!fs.existsSync(sectionDir)) {
      fs.mkdirSync(sectionDir, { recursive: true });
    }
    
    console.error(`\n=== Section: ${sectionName} ===`);
    
    // Click section using native Playwright click
    console.error('Clicking section...');
    for (const frame of page.frames()) {
      try {
        const sectionItem = frame.locator(`[role="treeitem"]:has-text("${sectionName}")`).first();
        if (await sectionItem.isVisible({ timeout: 1000 }).catch(() => false)) {
          await sectionItem.click({ timeout: 5000 });
          console.error('  ✓ Section clicked');
          break;
        }
      } catch (e) {}
    }
    
    await page.waitForTimeout(5000);
    
    // Get list of pages in this section
    if (!section.pages || section.pages.length === 0) {
      console.error('  No pages specified, skipping');
      continue;
    }
    
    // Extract each page
    for (const pageName of section.pages) {
      console.error(`  Extracting: ${pageName}`);
      
      try {
        // Click page using native Playwright click
        let clicked = false;
        for (const frame of page.frames()) {
          try {
            const clickableChild = frame.locator(`.pageNode:has-text("${pageName}") .pageListItem`).first();
            
            if (await clickableChild.isVisible({ timeout: 1000 }).catch(() => false)) {
              await clickableChild.click({ timeout: 5000 });
              clicked = true;
              break;
            }
          } catch (e) {}
        }
        
        if (!clicked) {
          console.error(`    ✗ Could not find page`);
          continue;
        }
        
        // Wait for content
        await page.waitForTimeout(8000);
        
        // Extract from iframe
        let content = '';
        for (const frame of page.frames()) {
          const url = frame.url();
          if (url.includes('onenoteframe')) {
            try {
              content = await frame.evaluate(() => document.body?.innerText || '');
              break;
            } catch (e) {}
          }
        }
        
        if (content && content.length > 100) {
          // Save to file
          const filename = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md';
          const filepath = path.join(sectionDir, filename);
          fs.writeFileSync(filepath, content);
          console.error(`    ✓ Saved ${content.length} chars to ${filename}`);
        } else {
          console.error(`    ✗ No content extracted`);
        }
        
        // Small delay between pages
        await page.waitForTimeout(2000);
        
      } catch (err) {
        console.error(`    ✗ Error: ${err.message}`);
      }
    }
  }
  
  await browser.close();
  console.error('\n=== Extraction complete ===');
}

// CLI usage
if (require.main === module) {
  const configFile = process.argv[2];
  
  if (!configFile) {
    console.error('Usage: onenote-batch-extract.js <config.json>');
    console.error('\nConfig format:');
    console.error(JSON.stringify({
      notebookUrl: "https://1drv.ms/o/c/your-notebook-id/...",
      outputDir: "./output",
      sections: [
        {
          name: "Section 1",
          pages: ["Page A", "Page B", "Page C"]
        },
        {
          name: "Section 2",
          pages: ["Introduction", "Notes", "Summary"]
        }
      ]
    }, null, 2));
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  
  extractAllPages(config.notebookUrl, config.sections, config.outputDir)
    .catch(err => {
      console.error('Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { extractAllPages };
