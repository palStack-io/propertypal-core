# propertyPal Core — Backend

Flask + SQLAlchemy REST API for propertyPal Core (single user, single property).
For setup, configuration and Docker usage, see the [top-level README](../README.md).

## Local development

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask db upgrade
python run.py
```

Environment variables are documented in [`../.env.example`](../.env.example).

## API groups

`/api/auth` · `/api/users` · `/api/properties` · `/api/property_photos` · `/api/documents` ·
`/api/maintenance` · `/api/maintenance/checklist` · `/api/contractors` · `/api/appliances` ·
`/api/projects` · `/api/finances` · `/api/settings` · `/api/integrations` · `/api/modules`

## Utility scripts

| Script | Purpose |
|--------|---------|
| `seed_demo_accounts.py` | Creates the demo accounts; runs on startup when `DEMO_MODE=true` |
| `setup_single_user.py` | Interactive: creates the single admin account if no users exist |
| `reset_app.py` | Development reset: `--db`, `--uploads`, or `--all` (add `--force` to skip the prompt) |
