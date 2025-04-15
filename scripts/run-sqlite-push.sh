#!/bin/bash
# Run the SQLite push script

# Use ESM format for the module
echo '{
  "type": "module"
}' > scripts/package.json

# Run the script
node scripts/sqlite-push.js