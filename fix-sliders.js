// Script to add gradient-slider class to all range input sliders
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/components/InteractiveGradient.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace className="flex-1" with className="flex-1 gradient-slider" ONLY in range inputs
// We need to match: type="range" followed by className="flex-1" (possibly with other attributes in between)
// OR className="flex-1" followed by type="range"

let count = 0;
const lines = content.split('\n');
const result = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Check if this is a range input line or near one
  if (line.includes('type="range"') || (i > 0 && lines[i-1].includes('type="range"')) || (i > 1 && lines[i-2].includes('type="range"'))) {
    // Look ahead and behind for className="flex-1"
    for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 4); j++) {
      if (lines[j].includes('className="flex-1"') && !lines[j].includes('gradient-slider')) {
        // Make sure we're in a range input context
        let context = lines.slice(Math.max(0, j - 3), Math.min(lines.length, j + 3)).join('\n');
        if (context.includes('type="range"')) {
          lines[j] = lines[j].replace('className="flex-1"', 'className="flex-1 gradient-slider"');
          count++;
          break;
        }
      }
    }
  }
  
  result.push(lines[i]);
}

content = result.join('\n');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ Updated ${count} sliders with gradient-slider class`);
