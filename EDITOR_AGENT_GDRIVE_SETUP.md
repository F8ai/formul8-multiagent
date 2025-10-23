# Editor Agent - Google Drive Integration

## Overview

The **editor-agent** has a complete system for syncing data from Google Drive "Tech Ops" shared drive to populate agent data directories.

## What It Syncs

```json
{
  "folders": {
    "Database": "editor-agent/data/Database",
    "Validation": "editor-agent/data/Validation",
    "SOPs": "editor-agent/data/SOPs",
    "Metrc": "editor-agent/data/Metrc",
    "Manuals": "editor-agent/data/Manuals",
    "Formul8 Lists": "editor-agent/data/Formul8 Lists"
  }
}
```

## Architecture

```
Google Drive "Tech Ops"
├── Database/ → editor-agent/data/Database/
├── Validation/ → editor-agent/data/Validation/
├── SOPs/ → editor-agent/data/SOPs/
├── Metrc/ → editor-agent/data/Metrc/
├── Manuals/ → editor-agent/data/Manuals/
└── Formul8 Lists/ → editor-agent/data/Formul8 Lists/
                      ↓
              S3: s3://formul8-platform-deployments/data/editor-agent/
                      ↓
              All agents can access via data-loader.js
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/danielmcshan/GitHub/editor-agent/editor-agent

# Install Python dependencies
pip3 install -r requirements.txt

# Install rclone (if not already installed)
brew install rclone

# Install jq (for JSON parsing)
brew install jq
```

### 2. Configure rclone for Google Drive

```bash
# Run the setup script
./setup-tech-ops-sync.sh

# Or manually configure rclone
rclone config create formul8 drive \
  --drive-shared-with-me \
  --drive-scope drive.readonly
```

This will open a browser to authorize access to Google Drive.

### 3. Download Data from Google Drive

```bash
# Download specific folders
./sync-tech-ops.sh Database download
./sync-tech-ops.sh Validation download
./sync-tech-ops.sh SOPs download
./sync-tech-ops.sh Metrc download
./sync-tech-ops.sh Manuals download
./sync-tech-ops.sh "Formul8 Lists" download

# Or download everything (bash loop)
for folder in Database Validation SOPs Metrc Manuals "Formul8 Lists"; do
  ./sync-tech-ops.sh "$folder" download
done
```

### 4. Sync Data to S3

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent

# Sync editor-agent data to S3
aws s3 sync /Users/danielmcshan/GitHub/editor-agent/editor-agent/data/ \
  s3://formul8-platform-deployments/data/editor-agent/ \
  --storage-class INTELLIGENT_TIERING \
  --exclude ".DS_Store" \
  --exclude "*.tmp"
```

### 5. Enable in Agent

The editor-agent already has `data-loader.js` and `s3-config.json` configured. Just update the configuration:

```json
{
  "s3": {
    "bucketName": "formul8-platform-deployments",
    "prefix": "data/editor-agent",
    "region": "us-east-1"
  }
}
```

## Automated Daily Sync

### Setup Daily Sync (Optional)

```bash
cd /Users/danielmcshan/GitHub/editor-agent/editor-agent

# Run daily sync scheduler (keeps running)
python3 daily_sync.py --mode scheduler

# Or run once
python3 daily_sync.py --mode once

# Or run quick sync (scan only)
python3 daily_sync.py --mode quick
```

### Schedule with cron

Add to your crontab (`crontab -e`):

```bash
# Sync from Google Drive daily at 2 AM
0 2 * * * cd /Users/danielmcshan/GitHub/editor-agent/editor-agent && ./sync-tech-ops.sh Database download
10 2 * * * cd /Users/danielmcshan/GitHub/editor-agent/editor-agent && ./sync-tech-ops.sh Validation download
20 2 * * * cd /Users/danielmcshan/GitHub/editor-agent/editor-agent && ./sync-tech-ops.sh SOPs download
30 2 * * * cd /Users/danielmcshan/GitHub/editor-agent/editor-agent && ./sync-tech-ops.sh Metrc download

# Upload to S3 at 3 AM
0 3 * * * cd /Users/danielmcshan/GitHub/formul8-multiagent && ./scripts/sync-all-agent-data-to-s3.sh >> /tmp/s3-sync.log 2>&1
```

## Data Distribution System

The editor-agent has a sophisticated system for distributing files to appropriate agents:

```python
# From daily_sync.py
1. Scan Tech Ops files
2. Distribute pending files to agents
3. Generate RAG files for each agent
4. Create summary reports
```

### File Distribution Logic

```python
# core/file_distributor.py determines which agent gets which files:
- SOPs → operations-agent, compliance-agent
- Validation → compliance-agent, science-agent
- Database → All agents (baseline data)
- Metrc → operations-agent, compliance-agent
- Manuals → operations-agent, formulation-agent
```

## Usage Example

### Quick Start (Get All Data)

```bash
# 1. Clone and setup
cd /Users/danielmcshan/GitHub/editor-agent/editor-agent

# 2. Install dependencies
pip3 install -r requirements.txt
brew install rclone jq

# 3. Configure Google Drive access
./setup-tech-ops-sync.sh

# 4. Download all data
for folder in Database Validation SOPs Metrc Manuals "Formul8 Lists"; do
  ./sync-tech-ops.sh "$folder" download
done

# 5. Check what you got
du -sh data/*

# 6. Sync to S3
cd /Users/danielmcshan/GitHub/formul8-multiagent
aws s3 sync /Users/danielmcshan/GitHub/editor-agent/editor-agent/data/ \
  s3://formul8-platform-deployments/data/editor-agent/ \
  --storage-class INTELLIGENT_TIERING

# 7. Agents can now access via data-loader.js
```

## File Types Expected

Based on the system, here's what's likely in each folder:

| Folder | Expected Content | Size Estimate |
|--------|------------------|---------------|
| **Database** | Baseline data, configurations, agent configs | 10-100 MB |
| **Validation** | Compliance validation docs, checklists | 50-200 MB |
| **SOPs** | Standard Operating Procedures | 20-100 MB |
| **Metrc** | Metrc integration docs, examples | 10-50 MB |
| **Manuals** | Equipment manuals, guides | 100-500 MB |
| **Formul8 Lists** | Product lists, ingredient lists | 5-20 MB |

**Total Expected:** ~200 MB - 1 GB

## Integration with Other Agents

Once synced, other agents can access this data:

```javascript
// In any agent's lambda.js
const dataLoader = require('./data-loader');

// Load SOPs
const sops = await dataLoader.getData('editor-agent/SOPs/standard_process.pdf');

// Load validation checklist
const validation = await dataLoader.getData('editor-agent/Validation/compliance_checklist.json');

// Load manual
const manual = await dataLoader.getData('editor-agent/Manuals/equipment_manual.pdf');
```

## Benefits

1. ✅ **Centralized source of truth** - Google Drive as single source
2. ✅ **Automated sync** - Daily updates from Google Drive
3. ✅ **Smart distribution** - Files go to appropriate agents
4. ✅ **RAG generation** - Automatic vector DB creation
5. ✅ **S3 storage** - All agents can access
6. ✅ **Version tracking** - Track file changes over time
7. ✅ **Audit trail** - Log all sync operations

## Troubleshooting

### rclone not configured
```bash
./setup-tech-ops-sync.sh
```

### Permission denied
```bash
chmod +x sync-tech-ops.sh setup-tech-ops-sync.sh
```

### Google Drive auth expired
```bash
rclone config reconnect formul8:
```

### Files not syncing
```bash
# Check rclone status
rclone ls formul8:Tech\ Ops/Database

# Verbose sync
./sync-tech-ops.sh Database download --verbose
```

## Next Steps

1. **Setup rclone** - Configure Google Drive access
2. **Download data** - Pull all folders from Tech Ops
3. **Sync to S3** - Upload to formul8-platform-deployments
4. **Enable agents** - Update agent configs to use data
5. **Automate** - Set up daily sync with cron

---

**Status**: 🟡 Ready to configure (requires Google Drive access)  
**Location**: `/Users/danielmcshan/GitHub/editor-agent/editor-agent/`  
**Data Size**: ~200 MB - 1 GB (estimate)

