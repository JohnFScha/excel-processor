# OKLCH Color Format Fix for Export Functionality

## Problem

The `html2canvas` library doesn't support modern CSS color formats like `oklch()`, `oklab()`, `lch()`, and `lab()`. When trying to export components that use Tailwind CSS with these modern color formats, you get an error:

```
Error: Attempting to parse an unsupported color function "oklch"
```

## Solution

We implemented a multi-layered approach to handle this issue:

### 1. CSS Override Approach
We inject temporary CSS styles that override OKLCH colors with RGB equivalents during export:

```typescript
function addCompatibilityStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
    .export-mode, .export-mode * {
      color: rgb(0, 0, 0) !important;
    }
    .export-mode .text-muted-foreground {
      color: rgb(107, 114, 126) !important;
    }
    // ... more color mappings
  `;
  document.head.appendChild(style);
  return style;
}
```

### 2. Class-Based Override
We temporarily add an `export-mode` class to the target element, which applies RGB color overrides:

```typescript
// Add export mode class
element.classList.add('export-mode');

// Wait for styles to apply
await new Promise(resolve => setTimeout(resolve, 300));

// Perform export
const canvas = await html2canvas(element, options);

// Restore original state
element.className = originalClasses;
```

### 3. Fallback Method
If the main export method fails, we have a fallback that creates a clone and forces all colors to compatible formats:

```typescript
export async function exportToPNGFallback(element: HTMLElement, filename: string) {
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Force all colors to be compatible
  const allElements = clone.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.color = '#000000';
    htmlEl.style.backgroundColor = htmlEl.style.backgroundColor || 'transparent';
    htmlEl.style.borderColor = '#cccccc';
  });
  
  // Export the clone
  const canvas = await html2canvas(clone, options);
}
```

## Implementation Details

### Export Functions
- `exportToPNG()`: Exports element as PNG image
- `exportToPDF()`: Exports element as PDF document
- `exportToPNGFallback()`: Fallback method for problematic cases

### Color Mappings
Common Tailwind colors mapped to RGB:
- `text-muted-foreground` → `rgb(107, 114, 126)`
- `text-green-500/600` → `rgb(34, 197, 94)`
- `text-red-500/600` → `rgb(239, 68, 68)`
- `text-blue-500/600` → `rgb(59, 130, 246)`

### Usage in Component
```typescript
const handleExportToPNG = async () => {
  try {
    await exportElementToPNG(resultsRef.current, 'results.png');
    showMessage('Imagen exportada correctamente');
  } catch (err) {
    // Try fallback method
    await exportToPNGFallback(resultsRef.current, 'results.png');
    showMessage('Imagen exportada (método alternativo)');
  }
};
```

## Benefits

1. **Automatic Color Conversion**: OKLCH colors are automatically converted to RGB
2. **Non-Destructive**: Original element styles are preserved
3. **Fallback Support**: Multiple export methods ensure reliability
4. **Clean Output**: White backgrounds and proper contrast for export
5. **Temporary Changes**: All style modifications are reverted after export

## Future Improvements

- Support for more color formats (HSL, etc.)
- Better color contrast detection
- Custom color mapping configuration
- Integration with design system color tokens

## Browser Compatibility

This solution works in all modern browsers that support:
- `html2canvas` library
- CSS `!important` declarations
- Dynamic stylesheet injection
- `TreeWalker` API

The fallback method provides additional compatibility for edge cases.