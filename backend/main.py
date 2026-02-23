from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import Base, engine

# Import models so SQLAlchemy knows them before create_all
from models import Inventory, Stock, Product, POS, POSSession  # noqa: F401

# Routers
from routers import inventory, stock, product, pos, pos_session

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



# ... keep your existing imports

# Only auto-create in local dev if explicitly enabled
if os.getenv("AUTO_CREATE_TABLES", "false").lower() == "true":
    Base.metadata.create_all(bind=engine)

app.include_router(inventory.router)
app.include_router(stock.router)
app.include_router(product.router)      # include ONCE only
app.include_router(pos.router)
app.include_router(pos_session.router)

@app.get("/")
def root():
    return {"message": "API is running"}