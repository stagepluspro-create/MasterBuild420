#!/bin/bash
# Quick script to apply the same fixes to consoles and fixtures pages

echo "Fixing consoles page..."
node -e "
const fs = require('fs');
const file = 'app/equipment/consoles/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
  \"import { useState, useEffect } from 'react';\",
  \"import { useState, useEffect, useCallback } from 'react';\\nimport { useAuth } from '@/lib/auth-context';\"
);

// Add auth and loading states
content = content.replace(
  'export default function ConsolesBrowserPage() {\\n  const [consoles',
  'export default function ConsolesBrowserPage() {\\n  const { user } = useAuth();\\n  const [consoles'
);

content = content.replace(
  '  const [types, setTypes] = useState<string[]>([]);',
  '  const [types, setTypes] = useState<string[]>([]);\\n  const [loading, setLoading] = useState(true);\\n  const [error, setError] = useState<string | null>(null);'
);

// Fix useEffect
content = content.replace(
  /useEffect\(\(\) => \{\\n    setManufacturers\(EquipmentService\.getManufacturers\('consoles'\)\);\\n    setTypes\(EquipmentService\.getTypes\('consoles'\)\);\\n    loadConsoles\(\);\\n  \}, \[\]\);/,
  \"useEffect(() => {\\n    try {\\n      setManufacturers(EquipmentService.getManufacturers('consoles'));\\n      setTypes(EquipmentService.getTypes('consoles'));\\n      setLoading(false);\\n    } catch (err: any) {\\n      console.error('Failed to load equipment metadata:', err);\\n      setError(err.message || 'Failed to load equipment data');\\n      setLoading(false);\\n    }\\n  }, []);\"
);

// Fix loadConsoles function
content = content.replace(
  /useEffect\(\(\) => \{\\n    loadConsoles\(\);\\n  \}, \[searchQuery, selectedManufacturer, selectedType\]\);\\n\\n  const loadConsoles = \(\) => \{\\n    const results = EquipmentService\.searchEquipment\('consoles', \{\\n      query: searchQuery,\\n      manufacturer: selectedManufacturer \|\| undefined,\\n      type: selectedType \|\| undefined,\\n    \}\);\\n    setConsoles\(results as Console\[\]\);\\n  \};/,
  \"const loadConsoles = useCallback(() => {\\n    try {\\n      const results = EquipmentService.searchEquipment('consoles', {\\n        query: searchQuery,\\n        manufacturer: selectedManufacturer || undefined,\\n        type: selectedType || undefined,\\n      });\\n      setConsoles(results as Console[]);\\n      setError(null);\\n    } catch (err: any) {\\n      console.error('Failed to search consoles:', err);\\n      setError(err.message || 'Failed to search equipment');\\n      setConsoles([]);\\n    }\\n  }, [searchQuery, selectedManufacturer, selectedType]);\\n\\n  useEffect(() => {\\n    loadConsoles();\\n  }, [loadConsoles]);\"
);

// Add loading/error states before return
content = content.replace(
  '  return (\\n    <div className=\"container mx-auto px-4 py-8\">',
  '  if (loading) {\\n    return (\\n      <div className=\"container mx-auto px-4 py-8\">\\n        <div className=\"flex items-center justify-center min-h-[400px]\">\\n          <div className=\"text-center\">\\n            <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E8FF] mx-auto mb-4\"></div>\\n            <p className=\"text-white/60\">Loading consoles...</p>\\n          </div>\\n        </div>\\n      </div>\\n    );\\n  }\\n\\n  if (error) {\\n    return (\\n      <div className=\"container mx-auto px-4 py-8\">\\n        <div className=\"flex items-center justify-center min-h-[400px]\">\\n          <div className=\"text-center\">\\n            <p className=\"text-red-400 mb-4\">{error}</p>\\n            <button\\n              onClick={() => window.location.reload()}\\n              className=\"text-[#00E8FF] hover:underline\"\\n            >\\n              Try again\\n            </button>\\n          </div>\\n        </div>\\n      </div>\\n    );\\n  }\\n\\n  return (\\n    <div className=\"container mx-auto px-4 py-8\">'
);

fs.writeFileSync(file, content);
console.log('✓ Fixed consoles page');
"

echo "Done!"
