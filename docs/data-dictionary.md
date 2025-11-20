# docs/data-dictionary.md
## Microphones
- id: unique string
- brand: manufacturer
- model: model name
- type: Dynamic/Condenser/etc
- polarPattern: primary polar pattern
- maxSPLdB: maximum sound pressure level
- selfNoisedB: mic equivalent noise
- frequencyResponseHz: textual range
- proximityEffect: boolean
- intendedUse: array of recommended uses

## Speakers
- id, brand, model, type, maxSPLdB, coverage, frequencyResponseHz, weightKg, powerRatingW

## Consoles
- id, brand, model, inputs, outputs, buses, network, sample_rates

## Fixtures
- id, brand, model, category, dmxModes (array), physical (weight/power), photometric
