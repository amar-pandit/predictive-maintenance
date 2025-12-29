Backend environment variables

- Copy `backend/.env.example` to `backend/.env` and edit values as needed.
- Install dependencies (from the `backend` folder):

```bash
pip install -r requirements.txt
```

- Run the API locally (from the repo root):

```bash
cd backend
uvicorn backend.main:app --host ${UVICORN_HOST:-127.0.0.1} --port ${UVICORN_PORT:-8000}
```

Or run the module directly (uses values from `.env`):

```bash
python backend/main.py
```

Configurable environment variables (see `backend/.env.example`):
- `MODEL_PATH` - path to the trained model `.pkl` file
- `SCALER_PATH` - path to the scaler `.pkl` file
- `HIGH_RISK_THRESHOLD` - probability threshold for high risk
- `MEDIUM_RISK_THRESHOLD` - probability threshold for medium risk
- `UVICORN_HOST` / `UVICORN_PORT` - host and port for uvicorn
- `UVICORN_RELOAD` - set to `true` to enable uvicorn reload during development
