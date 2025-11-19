# Storage Migration Guide

## Overview

As of this update, generated app files are now stored **outside the project root** to keep the repository clean and separate user-generated content from application code.

## What Changed

### Before
```
rush/
└── apps/
    └── api/
        └── storage/          # ❌ Inside project
            └── projects/
```

### After
```
/home/odoo/rush-storage/      # ✅ Outside project
└── projects/
    └── [project-id]/
        ├── index.html
        ├── css/
        └── js/
```

## Migration Steps

### 1. Update Configuration

Add to `apps/api/.env`:
```bash
# Storage directory for generated app files
STORAGE_BASE_DIR="/home/odoo/rush-storage"
```

### 2. Migrate Existing Files (Optional)

If you have existing projects in the old location:

```bash
# Create new storage directory
mkdir -p /home/odoo/rush-storage

# Move existing projects (if any)
if [ -d "/home/odoo/rush/apps/api/storage/projects" ]; then
  mv /home/odoo/rush/apps/api/storage/projects /home/odoo/rush-storage/
  echo "✅ Projects migrated to /home/odoo/rush-storage/projects"
else
  mkdir -p /home/odoo/rush-storage/projects
  echo "✅ Created new storage directory"
fi
```

### 3. Restart Servers

```bash
# Stop existing servers
./dev-stop.sh

# Start with new configuration
./dev.sh
```

## Custom Storage Location

You can use any directory for storage:

```bash
# In apps/api/.env
STORAGE_BASE_DIR="/mnt/external/rush-storage"
STORAGE_BASE_DIR="$HOME/Documents/rush-apps"
STORAGE_BASE_DIR="/var/www/rush-storage"
```

**Requirements**:
- Directory must be writable by the API server
- Sufficient disk space for generated files
- Accessible by the user running the application

## Benefits

### 🧹 Clean Repository
- Generated files don't clutter the git repository
- Easier to manage version control
- Smaller repository size

### 🔒 Better Security
- User-generated content separate from application code
- Easier to backup only app data
- Can apply different permissions

### 📦 Easier Deployment
- Storage can be on different disk/mount
- Scale storage independently
- Easier to migrate data

### 🗂️ Better Organization
- All user projects in one location
- Easy to backup/restore
- Simpler to manage disk space

## Backup Strategy

### Backup Projects
```bash
# Backup all projects
tar -czf rush-projects-backup-$(date +%Y%m%d).tar.gz /home/odoo/rush-storage/projects/

# Restore from backup
tar -xzf rush-projects-backup-YYYYMMDD.tar.gz -C /
```

### Backup Database
```bash
# Backup database
cp /home/odoo/rush/apps/api/data/dev.db /path/to/backup/

# Or use Prisma
cd /home/odoo/rush/apps/api
pnpm dlx prisma db push --schema prisma/schema.prisma
```

## Troubleshooting

### Permission Errors
```bash
# Ensure directory is writable
chmod -R 755 /home/odoo/rush-storage
chown -R $USER:$USER /home/odoo/rush-storage
```

### Storage Not Found
```bash
# Check environment variable
cd /home/odoo/rush/apps/api
cat .env | grep STORAGE_BASE_DIR

# Verify directory exists
ls -la /home/odoo/rush-storage/
```

### Files Not Showing in Preview
```bash
# Check API logs
tail -f /home/odoo/rush/.dev-logs/api.log

# Verify storage path in config
cd /home/odoo/rush/apps/api
python3 -c "from app.config import STORAGE_DIR; print(STORAGE_DIR)"
```

## Notes

- Default location works for most users
- Storage directory is created automatically
- Old `apps/api/storage/` folder can be safely deleted after migration
- Database location unchanged (still in `apps/api/data/`)

---

**Need Help?** Check the main README.md or create an issue on GitHub.

