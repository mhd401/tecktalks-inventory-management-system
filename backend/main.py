import os
from models import Inventory, Stock, Product, POS, POSSession, User
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

# Import models so SQLAlchemy knows them before create_all


# Routers
from routers.inventory import router as inventory_router
from routers.stock import router as stock_router
from routers.pos_session import router as pos_session_router
from routers import product, pos

app = FastAPI(title="TechTalks Inventory API")

# CORS for React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only auto-create tables in local dev if explicitly enabled
if os.getenv("AUTO_CREATE_TABLES", "false").lower() == "true":
    Base.metadata.create_all(bind=engine)

# Routers (include each ONCE)
app.include_router(inventory_router)
app.include_router(stock_router)
app.include_router(pos_session_router)
app.include_router(product.router)
app.include_router(pos.router)

@app.get("/")
def root():
    return {"message": "API is running"}