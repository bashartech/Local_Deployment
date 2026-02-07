from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Load environment variables explicitly
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv is not installed, environment variables should be loaded by the system
    pass

# Import JWT middleware
try:
    from .middleware.jwt_middleware import JWTBearer
except ImportError:
    from middleware.jwt_middleware import JWTBearer

app = FastAPI(title="Todo App Backend")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add JWT authentication middleware for protected routes
# We'll use JWTBearer as a dependency in individual routes rather than global middleware
# to have more control over which routes are protected

@app.get("/")
def read_root():
    return {"message": "Welcome to the Todo App Backend!"}

# Include routes
try:
    from .routes import tasks
    from .routes import chat
    from .health import router as health_router
except (ImportError, ValueError):
    from routes import tasks
    from routes import chat
    from health import router as health_router

app.include_router(tasks.router, prefix="/api")
app.include_router(chat.router)
app.include_router(health_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
