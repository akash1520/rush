from fastapi import FastAPI

app = FastAPI(title="AI Site Builder API")


@app.get("/health")
async def health():
    return {"ok": True, "service": "api"}



