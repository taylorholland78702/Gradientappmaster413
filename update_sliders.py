#!/usr/bin/env python3
import re

# Read the file
with open('/app/src/app/components/InteractiveGradient.tsx', 'r') as f:
    content = f.read()

# Replace all instances of className="flex-1" that are in range inputs
# We need to be careful to only replace in input elements with type="range"
# Pattern: Find input elements with type="range" and className="flex-1" and add gradient-slider
content = re.sub(
    r'(<input[^>]*type="range"[^>]*className="flex-1)"',
    r'\1 gradient-slider"',
    content
)

# Write back
with open('/app/src/app/components/InteractiveGradient.tsx', 'w') as f:
    f.write(content)

print("Updated all range sliders to include gradient-slider class")
