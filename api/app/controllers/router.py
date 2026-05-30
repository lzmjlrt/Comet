"""聚合所有路由，统一挂在 /api 前缀下。

后续各阶段在此注册：auth / models / documents / images / tags /
conversations / chat / memories / search / favorites / dashboard / tasks。
"""
from fastapi import APIRouter

from app.controllers import health

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
