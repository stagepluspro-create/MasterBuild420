#!/usr/bin/env node
/**
 * Transform Equipment JSON Data
 *
 * Converts equipment JSON files to match TypeScript interfaces
 * - Maps field names (brand -> manufacturer, etc.)
 * - Adds missing fields with appropriate defaults
 * - Ensures all data matches expected schema
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Transform microphones
function transformMicrophone(mic) {
  return {
    id: mic.id || `mic_${Date.now()}`,
    manufacturer: mic.brand || mic.manufacturer || 'Unknown',
    model: mic.model || 'Unknown Model',
    type: mic.type || 'Dynamic',
    pattern: mic.pattern || 'Cardioid',
    frequency_response: mic.frequency_response_Hz || mic.frequency_response || '20-20000',
    impedance: mic.impedance || '150Ω',
    sensitivity: mic.sensitivity || '-54dBV/Pa',
    max_spl: mic.max_SPL_dB ? `${mic.max_SPL_dB} dB` : '120 dB',
    phantom_power: mic.phantom_power !== undefined
      ? (mic.phantom_power ? 'Required' : 'Not Required')
      : '48V Optional',
    connector: mic.connector || 'XLR',
    applications: Array.isArray(mic.applications) ? mic.applications : [],
    notes: mic.notes || ''
  };
}

// Transform speakers
function transformSpeaker(spk) {
  return {
    id: spk.id || `spk_${Date.now()}`,
    manufacturer: spk.brand || spk.manufacturer || 'Unknown',
    model: spk.model || 'Unknown Model',
    type: spk.type || 'Passive',
    wattage: spk.power_rating_W ? `${spk.power_rating_W}W` : (spk.wattage || '500W'),
    impedance: spk.impedance || '8Ω',
    frequency_range: spk.frequency_response_Hz || spk.frequency_range || '50-20000 Hz',
    spl: spk.max_SPL_dB ? `${spk.max_SPL_dB} dB` : (spk.spl || '120 dB'),
    coverage: spk.coverage || '90° x 60°',
    weight: spk.weight_kg ? `${spk.weight_kg} kg` : (spk.weight || '10 kg'),
    dimensions: spk.dimensions || '500 x 300 x 300 mm',
    applications: Array.isArray(spk.applications) ? spk.applications : ['Live Sound'],
    notes: spk.notes || ''
  };
}

// Transform consoles
function transformConsole(con) {
  return {
    id: con.id || `con_${Date.now()}`,
    manufacturer: con.brand || con.manufacturer || 'Unknown',
    model: con.model || 'Unknown Model',
    type: con.type || 'Digital',
    channels: con.inputs ? `${con.inputs} in / ${con.outputs || 0} out` : (con.channels || '32 in / 16 out'),
    faders: con.faders || '32',
    bus_count: con.buses ? `${con.buses}` : (con.bus_count || '16'),
    effects: con.effects || 'Built-in DSP',
    connectivity: Array.isArray(con.network)
      ? (con.network === 'None' ? ['Analog'] : [con.network])
      : (Array.isArray(con.connectivity) ? con.connectivity : ['Ethernet', 'USB']),
    dimensions: con.dimensions || '800 x 600 x 150 mm',
    weight: con.weight_kg ? `${con.weight_kg} kg` : (con.weight || '15 kg'),
    applications: Array.isArray(con.applications) ? con.applications : ['Live Sound', 'Studio'],
    notes: con.notes || ''
  };
}

// Transform fixtures
function transformFixture(fix) {
  return {
    id: fix.id || `fix_${Date.now()}`,
    manufacturer: fix.brand || fix.manufacturer || 'Unknown',
    model: fix.model || 'Unknown Model',
    type: fix.type || 'LED',
    wattage: fix.power_W ? `${fix.power_W}W` : (fix.wattage || '300W'),
    light_source: fix.light_source || 'LED',
    color_temp: fix.color_temp || '3200K-6500K',
    beam_angle: fix.beam_angle_deg || fix.beam_angle || '15°-40°',
    dmx_channels: Array.isArray(fix.dmx_modes)
      ? `${fix.dmx_modes[0] || 16} channels`
      : (fix.dmx_channels || '16 channels'),
    weight: fix.weight_kg ? `${fix.weight_kg} kg` : (fix.weight || '5 kg'),
    dimensions: fix.dimensions || '300 x 150 x 200 mm',
    applications: Array.isArray(fix.applications) ? fix.applications : ['Stage', 'Theatre'],
    notes: fix.notes || ''
  };
}

// Process files
function processFile(filename, transformFn) {
  const filePath = path.join(dataDir, filename);

  console.log(`\nProcessing ${filename}...`);

  // Read original file
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);

  console.log(`  Found ${data.length} items`);

  // Transform data
  const transformed = data.map(transformFn);

  // Validate transformed data
  let errors = 0;
  transformed.forEach((item, index) => {
    if (!item.manufacturer || item.manufacturer === 'Unknown') {
      console.warn(`  Warning: Item ${index} missing manufacturer`);
      errors++;
    }
    if (!item.model || item.model === 'Unknown Model') {
      console.warn(`  Warning: Item ${index} missing model`);
      errors++;
    }
  });

  // Create backup
  const backupPath = filePath.replace('.json', '.backup.json');
  fs.copyFileSync(filePath, backupPath);
  console.log(`  Created backup: ${path.basename(backupPath)}`);

  // Write transformed data
  fs.writeFileSync(filePath, JSON.stringify(transformed, null, 2));
  console.log(`  ✓ Transformed ${transformed.length} items`);

  if (errors > 0) {
    console.log(`  ⚠ ${errors} warnings found`);
  }

  return transformed.length;
}

// Main execution
console.log('='.repeat(60));
console.log('Equipment Data Transformation');
console.log('='.repeat(60));

try {
  const counts = {
    microphones: processFile('microphones_v2.json', transformMicrophone),
    speakers: processFile('speakers_v2.json', transformSpeaker),
    consoles: processFile('consoles_v2.json', transformConsole),
    fixtures: processFile('fixtures_v2.json', transformFixture)
  };

  console.log('\n' + '='.repeat(60));
  console.log('Transformation Complete!');
  console.log('='.repeat(60));
  console.log(`Total items transformed: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  console.log(`  - Microphones: ${counts.microphones}`);
  console.log(`  - Speakers: ${counts.speakers}`);
  console.log(`  - Consoles: ${counts.consoles}`);
  console.log(`  - Fixtures: ${counts.fixtures}`);
  console.log('\nBackup files created with .backup.json extension');
  console.log('='.repeat(60));

  process.exit(0);
} catch (error) {
  console.error('\n❌ Transformation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
