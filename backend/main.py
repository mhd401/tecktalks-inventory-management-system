from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.inventory import router as inventory_router
from routers.stock import router as stock_router
from routers.pos_session import router as pos_session_router
from routers import product, pos

app = FastAPI(title="Inventory Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inventory_router)
app.include_router(stock_router)
app.include_router(pos_session_router)
app.include_router(product.router)
app.include_router(pos.router)
