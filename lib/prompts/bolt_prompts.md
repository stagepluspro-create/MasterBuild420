# lib/prompts/bolt_prompts.md

## Prompt: Generate Microphone Detail Page
Using the IMicrophone TypeScript interface in lib/models/microphone.ts, build a React TypeScript Next.js page component that:
- Accepts microphone id as route param
- Fetches `/api/microphones/:id`
- Renders header with brand + model
- Shows key specs in a grid (type, polarPattern, maxSPLdB, selfNoisedB, freq response)
- Shows an interactive polar plot placeholder component
- Provides 'Compare' button to add to compare list
- Uses Zod to validate fetched data
Return only component code and import list, no extra prose.

## Prompt: Generate Mic Search Page
Create a page with filters: brand(select), type(select), application(tags), frequency-range slider, proximity-effect toggle. Query `/api/microphones?filters...` Implement client-side caching and debounce for search.
