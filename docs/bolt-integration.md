# docs/bolt-integration.md

## Overview
This project contains the 'Ultimate' datasets and the import scripts for Bolt integration.

- Dataset ZIP on the workspace: /mnt/data/ultimate_databases_v2_insane.zip
- Project data folder: /mnt/data/bolt_project_files/data

## Steps to import into Bolt / local DB
1. Copy the zip contents into `./data/` folder (already available in workspace).
2. Run node script: `node --loader ts-node/esm lib/data/import-json.ts` (or compile tsc and run).
3. Ensure `lib/schemas` are available to validation step.
4. Start app and verify endpoints.

## Notes
- The import script uses Zod schemas for validation.
- Index the following fields for fast search: brand, model, type, category, dmxModes.
