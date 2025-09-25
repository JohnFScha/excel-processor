/**
 * Export utilities for Excel processor results
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
}





/**
 * Create a completely isolated clone with all OKLCH colors stripped and replaced
 */
function createExportClone(element: HTMLElement): HTMLElement {
  // Create a completely new container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.5';
  container.style.color = '#000000';
  
  // Clone the element
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Recursively fix all elements in the clone
  const fixElement = (el: Element) => {
    if (el instanceof HTMLElement) {
      // Clear all existing styles that might contain OKLCH
      el.style.cssText = '';
      
      // Apply safe styles based on class names
      const classList = Array.from(el.classList);
      
      // Reset to safe defaults
      el.style.color = '#000000';
      el.style.backgroundColor = 'transparent';
      el.style.border = 'none';
      el.style.margin = '0';
      el.style.padding = '0';
      
      // Apply specific styling based on semantic classes
      if (classList.some(c => c.includes('card'))) {
        el.style.backgroundColor = '#ffffff';
        el.style.border = '1px solid #e5e7eb';
        el.style.borderRadius = '8px';
        el.style.padding = '16px';
        el.style.margin = '8px 0';
      }
      
      if (classList.some(c => c.includes('header'))) {
        el.style.paddingBottom = '12px';
        el.style.marginBottom = '12px';
        el.style.borderBottom = '1px solid #e5e7eb';
      }
      
      if (classList.some(c => c.includes('title'))) {
        el.style.fontSize = '18px';
        el.style.fontWeight = 'bold';
        el.style.color = '#000000';
        el.style.marginBottom = '8px';
      }
      
      if (classList.some(c => c.includes('description'))) {
        el.style.color = '#6b7280';
        el.style.fontSize = '14px';
      }
      
      if (classList.some(c => c.includes('text-green'))) {
        el.style.color = '#059669';
      }
      
      if (classList.some(c => c.includes('text-red'))) {
        el.style.color = '#dc2626';
      }
      
      if (classList.some(c => c.includes('text-blue'))) {
        el.style.color = '#2563eb';
      }
      
      if (classList.some(c => c.includes('text-muted'))) {
        el.style.color = '#6b7280';
      }
      
      if (classList.some(c => c.includes('badge'))) {
        el.style.backgroundColor = '#f3f4f6';
        el.style.color = '#374151';
        el.style.padding = '2px 8px';
        el.style.borderRadius = '4px';
        el.style.fontSize = '12px';
        el.style.display = 'inline-block';
      }
      
      if (classList.some(c => c.includes('button'))) {
        el.style.backgroundColor = '#f9fafb';
        el.style.border = '1px solid #d1d5db';
        el.style.padding = '8px 16px';
        el.style.borderRadius = '6px';
        el.style.color = '#374151';
      }
      
      // Handle flex layouts
      if (classList.some(c => c.includes('flex'))) {
        el.style.display = 'flex';
      }
      
      if (classList.some(c => c.includes('space-x') || c.includes('gap'))) {
        el.style.gap = '8px';
      }
      
      if (classList.some(c => c.includes('justify-between'))) {
        el.style.justifyContent = 'space-between';
      }
      
      if (classList.some(c => c.includes('items-center'))) {
        el.style.alignItems = 'center';
      }
      
      // Handle spacing
      if (classList.some(c => c.includes('space-y'))) {
        el.style.display = 'block';
        const children = Array.from(el.children);
        children.forEach((child, index) => {
          if (index > 0 && child instanceof HTMLElement) {
            child.style.marginTop = '16px';
          }
        });
      }
      
      if (classList.some(c => c.includes('mt-'))) {
        el.style.marginTop = '8px';
      }
      
      if (classList.some(c => c.includes('mb-'))) {
        el.style.marginBottom = '8px';
      }
      
      if (classList.some(c => c.includes('p-'))) {
        el.style.padding = '16px';
      }
      
      // Handle text sizing
      if (classList.some(c => c.includes('text-lg'))) {
        el.style.fontSize = '18px';
      }
      
      if (classList.some(c => c.includes('text-sm'))) {
        el.style.fontSize = '14px';
      }
      
      if (classList.some(c => c.includes('text-xs'))) {
        el.style.fontSize = '12px';
      }
      
      if (classList.some(c => c.includes('font-medium'))) {
        el.style.fontWeight = '500';
      }
      
      if (classList.some(c => c.includes('font-bold') || c.includes('font-semibold'))) {
        el.style.fontWeight = 'bold';
      }
      
      // Remove any remaining class attributes to prevent CSS conflicts
      el.removeAttribute('class');
    }
    
    // Recursively fix children
    Array.from(el.children).forEach(fixElement);
  };
  
  fixElement(clone);
  container.appendChild(clone);
  
  return container;
}

/**
 * Export HTML element to PNG using complete DOM isolation
 */
export async function exportToPNG(element: HTMLElement, filename: string = 'export.png'): Promise<void> {
  // Create isolated clone
  const exportContainer = createExportClone(element);
  document.body.appendChild(exportContainer);
  
  try {
    // Wait for any dynamic content to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(exportContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: exportContainer.scrollWidth,
      height: exportContainer.scrollHeight,
      ignoreElements: (element) => {
        return element.tagName === 'IFRAME' || element.tagName === 'VIDEO';
      }
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    // Clean up
    document.body.removeChild(exportContainer);
  }
}

/**
 * Export HTML element to PDF using complete DOM isolation
 */
export async function exportToPDF(element: HTMLElement, filename: string = 'export.pdf'): Promise<void> {
  // Create isolated clone
  const exportContainer = createExportClone(element);
  document.body.appendChild(exportContainer);
  
  try {
    // Wait for any dynamic content to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(exportContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: exportContainer.scrollWidth,
      height: exportContainer.scrollHeight,
      ignoreElements: (element) => {
        return element.tagName === 'IFRAME' || element.tagName === 'VIDEO';
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 190;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20; // Account for margins

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(exportContainer);
  }
}

/**
 * Simple fallback export to PNG using text-only approach
 */
export async function exportToPNGFallback(element: HTMLElement, filename: string = 'export.png'): Promise<void> {
  // Create a simple text-based version
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.6';
  container.style.color = '#000000';
  container.style.maxWidth = '800px';
  
  // Extract text content and create a simple layout
  const textContent = element.textContent || '';
  const lines = textContent.split('\n').filter(line => line.trim());
  
  lines.forEach((line) => {
    const p = document.createElement('p');
    p.style.margin = '8px 0';
    p.style.color = '#000000';
    p.textContent = line.trim();
    
    // Style based on content
    if (line.includes('✅') || line.includes('Exitoso')) {
      p.style.color = '#059669';
    } else if (line.includes('❌') || line.includes('Error') || line.includes('Fallido')) {
      p.style.color = '#dc2626';
    } else if (line.includes('📁') || line.includes('📋') || line.includes('📊')) {
      p.style.fontWeight = 'bold';
      p.style.marginTop = '16px';
    }
    
    container.appendChild(p);
  });
  
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      width: container.scrollWidth,
      height: container.scrollHeight,
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Ultra-simple canvas-based export as last resort
 */
export async function exportToPNGCanvas(element: HTMLElement, filename: string = 'export.png'): Promise<void> {
  // Create a canvas and draw text manually
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Set up canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.font = '14px Arial, sans-serif';
  
  // Extract and draw text
  const text = element.textContent || 'No content available';
  const lines = text.split('\n').filter(line => line.trim());
  
  let y = 30;
  const lineHeight = 20;
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && y < canvas.height - 20) {
      // Set color based on content
      if (trimmedLine.includes('✅') || trimmedLine.includes('Exitoso')) {
        ctx.fillStyle = '#059669';
      } else if (trimmedLine.includes('❌') || trimmedLine.includes('Error')) {
        ctx.fillStyle = '#dc2626';
      } else {
        ctx.fillStyle = '#000000';
      }
      
      // Word wrap for long lines
      const maxWidth = canvas.width - 40;
      const words = trimmedLine.split(' ');
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
          ctx.fillText(currentLine, 20, y);
          y += lineHeight;
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        ctx.fillText(currentLine, 20, y);
        y += lineHeight;
      }
    }
  });
  
  // Download the canvas
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Debug function to inspect element styles and detect OKLCH usage
 */
export function debugElementStyles(element: HTMLElement): void {
  console.log('=== EXPORT DEBUG INFO ===');
  console.log('Element:', element);
  console.log('Computed styles:', window.getComputedStyle(element));
  
  // Check for OKLCH in computed styles
  const computedStyle = window.getComputedStyle(element);
  const problematicProps: string[] = [];
  
  ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value.includes('oklch')) {
      problematicProps.push(`${prop}: ${value}`);
    }
  });
  
  if (problematicProps.length > 0) {
    console.warn('Found OKLCH colors:', problematicProps);
  } else {
    console.log('No OKLCH colors found on main element');
  }
  
  // Check child elements
  const allElements = element.querySelectorAll('*');
  let oklchCount = 0;
  allElements.forEach((el, index) => {
    if (index < 10) { // Only check first 10 for performance
      const childStyle = window.getComputedStyle(el);
      ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
        const value = childStyle.getPropertyValue(prop);
        if (value && value.includes('oklch')) {
          oklchCount++;
          console.warn(`Child element ${index} has OKLCH ${prop}:`, value);
        }
      });
    }
  });
  
  console.log(`Found ${oklchCount} child elements with OKLCH colors`);
  console.log('Element text content preview:', element.textContent?.substring(0, 200));
  console.log('=== END DEBUG INFO ===');
}

/**
 * Show success/error messages
 */
export function showMessage(message: string, type: 'success' | 'error' = 'success'): void {
  // You can replace this with a proper toast notification system
  if (type === 'success') {
    alert(`✅ ${message}`);
  } else {
    alert(`❌ ${message}`);
  }
}