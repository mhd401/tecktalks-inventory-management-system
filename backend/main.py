from fastapi import FastAPI

from routers.inventory import router as inventory_router
from routers.stock import router as stock_router
from routers.pos_session import router as pos_session_router
from fastapi import FastAPI
from routers import product
from routers import pos


app = FastAPI(title="Inventory Management System")

app.include_router(inventory_router)
app.include_router(stock_router)
app.include_router(pos_session_router)
app.include_router(product.router)
app.include_router(pos.router)
app.include_router(product.router)
