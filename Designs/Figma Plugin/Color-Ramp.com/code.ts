/*
 Color-Ramp.com Figma Plugin
 Created by Ricardo Zea
 https://ricardozea.design
 7/4/2025
*/

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// Helper function to convert hex to RGBA
function hexToRgba(hex: string): RGBA {
  let r = 0, g = 0, b = 0;
  // 3 digits
  if (hex.length == 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  // 6 digits
  } else if (hex.length == 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
}

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 720 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'import-variables') {
    return;
  }

  try {
    const data = JSON.parse(msg.json);

    // --- 1. Validate JSON Structure ---
    if (!data.format || !data.collectionName) {
      throw new Error('JSON must have a "format" and "collectionName".');
    }

    // --- 2. Create Figma Variables ---
    const collectionName = `${data.collectionName} (${data.format})`;
    const collection = figma.variables.createVariableCollection(collectionName);
    let count = 0;

    if (data.format === 'paired' || data.format === 'light ramp' || data.format === 'dark ramp' || data.format === 'light-ramp-paired' || data.format === 'dark-ramp-paired') {
      if (!data.colors) throw new Error(`"${data.format}" format requires a "colors" object.`);
      
      const lightModeId = collection.modes[0].modeId;
      
      // For paired formats, add a dark mode
      if (data.format === 'paired') {
        collection.renameMode(lightModeId, 'Light');
        const darkModeId = collection.addMode('Dark');
        for (const colorName in data.colors) {
          for (const scale in data.colors[colorName]) {
            const varName = `${colorName}/${scale}`;
            const variable = figma.variables.createVariable(varName, collection, 'COLOR');
            variable.setValueForMode(lightModeId, hexToRgba(data.colors[colorName][scale].Light));
            variable.setValueForMode(darkModeId, hexToRgba(data.colors[colorName][scale].Dark));
            count++;
          }
        }
      } 
      // For light ramp, only use light mode
      else if (data.format === 'light ramp' || data.format === 'light-ramp-paired') {
        collection.renameMode(lightModeId, 'Light');
        for (const colorName in data.colors) {
          for (const scale in data.colors[colorName]) {
            const varName = `${colorName}/${scale}`;
            const variable = figma.variables.createVariable(varName, collection, 'COLOR');
            variable.setValueForMode(lightModeId, hexToRgba(data.colors[colorName][scale]));
            count++;
          }
        }
      } 
      // For dark ramp, only use dark mode
      else if (data.format === 'dark ramp' || data.format === 'dark-ramp-paired') {
        collection.renameMode(lightModeId, 'Dark');
        for (const colorName in data.colors) {
          for (const scale in data.colors[colorName]) {
            const varName = `${colorName}/${scale}`;
            const variable = figma.variables.createVariable(varName, collection, 'COLOR');
            variable.setValueForMode(lightModeId, hexToRgba(data.colors[colorName][scale]));
            count++;
          }
        }
      }
    } 
    // Handle themed format (only full themed, no single-ramp themed)
    else if (data.format === 'themed') {
      if (!data.themes?.Light || !data.themes?.Dark) {
        throw new Error('"themed" format requires "themes.Light" and "themes.Dark" objects.');
      }
      
      const modeId = collection.modes[0].modeId;
      collection.renameMode(modeId, 'Value');
      
      // Process light theme
      for (const colorName in data.themes.Light) {
        for (const scale in data.themes.Light[colorName]) {
          const varName = `Light/${colorName}/${scale}`;
          const variable = figma.variables.createVariable(varName, collection, 'COLOR');
          variable.setValueForMode(modeId, hexToRgba(data.themes.Light[colorName][scale]));
          count++;
        }
      }
      
      // Process dark theme
      for (const colorName in data.themes.Dark) {
        for (const scale in data.themes.Dark[colorName]) {
          const varName = `Dark/${colorName}/${scale}`;
          const variable = figma.variables.createVariable(varName, collection, 'COLOR');
          variable.setValueForMode(modeId, hexToRgba(data.themes.Dark[colorName][scale]));
          count++;
        }
      }
    } else {
      throw new Error(`Unsupported format: "${data.format}".`);
    }

    figma.notify(`${count} variables created in '${collectionName}'.`);

    // --- 3. Create JSON Backup Page with Frame ---
    const page = figma.createPage();
    page.name = `${data.collectionName} - JSON`;

    // Load all necessary fonts first
    const instructionFont = { family: "Inter", style: "Regular" };
    const jsonFont = { family: "Roboto Mono", style: "Regular" };
    await Promise.all([
        figma.loadFontAsync(instructionFont),
        figma.loadFontAsync(jsonFont)
    ]);

    // Create the main frame
    const frame = figma.createFrame();
    frame.name = "JSON Export";
    frame.layoutMode = "VERTICAL";
    frame.paddingTop = 20;
    frame.paddingRight = 20;
    frame.paddingBottom = 20;
    frame.paddingLeft = 20;
    frame.itemSpacing = 16;
    frame.cornerRadius = 8;
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    frame.x = 50;
    frame.y = 50;
    frame.resize(400, frame.height);

    // Create instructional text
    const instructionText = figma.createText();
    instructionText.fontName = instructionFont;
    instructionText.characters = "This is a backup of your color ramp(s). To import these colors into Figma variables (as color primitives), open the 'ColorRamp' Figma plugin, paste the JSON code below, and click the 'Import Color Ramps!' button.";
    instructionText.layoutAlign = 'STRETCH';

    // Create JSON text node
    const jsonText = figma.createText();
    jsonText.fontName = jsonFont;
    // Format the JSON and convert all hex color values to uppercase for consistency.
    const prettyJson = JSON.stringify(JSON.parse(msg.json), null, 2);
    jsonText.characters = prettyJson.replace(/"#[0-9a-f]{6}"/gi, (match) => match.toUpperCase());
    jsonText.layoutAlign = 'STRETCH';

    // Add text nodes to the frame
    frame.appendChild(instructionText);
    frame.appendChild(jsonText);

    // Create the footer
    const footerFrame = figma.createFrame();
    footerFrame.name = "Footer";
    footerFrame.layoutMode = "HORIZONTAL";
    footerFrame.paddingTop = 10;
    footerFrame.paddingRight = 0;
    footerFrame.paddingBottom = 10;
    footerFrame.paddingLeft = 0;
    footerFrame.fills = []; // No background for the footer frame itself
    footerFrame.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    footerFrame.strokeTopWeight = 1;

    const footerText = figma.createText();
    footerText.fontName = instructionFont; // Re-use the loaded 'Inter' font
    footerText.characters = "JSON code created with Color-Ramp.com";
    footerText.fontSize = 12;

    // Style the link portion
    const linkText = "Color-Ramp.com";
    const startIndex = footerText.characters.indexOf(linkText);
    if (startIndex !== -1) {
        const endIndex = startIndex + linkText.length;
        footerText.setRangeHyperlink(startIndex, endIndex, { type: 'URL', value: 'https://color-ramp.com' });
        footerText.setRangeFills(startIndex, endIndex, [{ type: 'SOLID', color: { r: 0.05, g: 0.45, b: 0.98 } }]); // Blue link color
        footerText.setRangeTextDecoration(startIndex, endIndex, 'UNDERLINE');
    }

    // Append nodes to the hierarchy first
    footerFrame.appendChild(footerText);
    frame.appendChild(footerFrame);

    // NOW, set the layout properties on the frame AFTER it has been appended
    footerFrame.layoutSizingHorizontal = 'FILL';
    footerFrame.layoutSizingVertical = 'HUG';

    // Add the frame to the page
    page.appendChild(frame);

    // Switch to the new page and set zoom
    await figma.setCurrentPageAsync(page);
    figma.viewport.zoom = 1;

    figma.notify(`Created a new page with the JSON backup.`);


  } catch (error: any) {
    figma.notify(`Error: ${error.message}`, { error: true });
  } finally {
    if (!msg.keepOpen) {
      figma.closePlugin();
    }
  }
};
