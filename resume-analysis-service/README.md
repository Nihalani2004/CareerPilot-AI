# Resume analysis service

This internal FastAPI service improves the existing Resume ATS Checker without changing the frontend contract. It evaluates PDF/DOCX extraction quality, document-layout risks, conventional sections, date ranges, skills, bullets, and measurable evidence. It does not call a generative AI provider.

## Run locally

```powershell
cd resume-analysis-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

The Node backend calls `http://127.0.0.1:8001/analyze` by default. If this service is unavailable, the existing deterministic ATS checks still return a report instead of failing the upload.

Use `GET /health` to confirm that the service is running.
