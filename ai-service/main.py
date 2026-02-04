"""
NutriVision AI Service - Main FastAPI Application

This microservice handles:
- Food image recognition using YOLOv8
- Portion size estimation
- GenAI chat completions for meal/workout planning
- Nutrition data lookup and calculations
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from app.config import settings
from app.routers import food_analysis, chat, plans, health
from app.services.model_loader import ModelLoader
from app.utils.logger import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting NutriVision AI Service...")
    
    # Load ML models
    try:
        model_loader = ModelLoader()
        await model_loader.load_models()
        app.state.model_loader = model_loader
        logger.info("✅ ML models loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load ML models: {e}")
        raise
    
    logger.info(f"✅ NutriVision AI Service started on port {settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down NutriVision AI Service...")
    
    # Cleanup
    if hasattr(app.state, 'model_loader'):
        await app.state.model_loader.unload_models()
    
    logger.info("✅ Cleanup complete")


# Create FastAPI application
app = FastAPI(
    title="NutriVision AI Service",
    description="""
    AI Microservice for NutriVision - Multimodal Personalized Fitness & Nutrition Planner
    
    ## Features
    
    * **Food Image Analysis** - Detect foods and estimate portions using computer vision
    * **Nutrition Lookup** - Get detailed nutritional information and GI/GL values
    * **GenAI Chat** - Natural language assistant for nutrition and fitness queries
    * **Meal Planning** - Generate personalized meal plans based on user goals
    * **Workout Planning** - Create customized workout routines
    
    ## Models Used
    
    * YOLOv8 for food detection
    * MiDaS for depth estimation (portion sizing)
    * OpenAI GPT-4 / GPT-3.5 for natural language generation
    """,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# ===========================================
# Middleware Configuration
# ===========================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ===========================================
# Route Registration
# ===========================================

app.include_router(
    health.router,
    prefix="/health",
    tags=["Health"]
)

app.include_router(
    food_analysis.router,
    prefix="/api/v1",
    tags=["Food Analysis"]
)

app.include_router(
    chat.router,
    prefix="/api/v1",
    tags=["GenAI Chat"]
)

app.include_router(
    plans.router,
    prefix="/api/v1",
    tags=["Plan Generation"]
)

# ===========================================
# Root Endpoint
# ===========================================

@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "NutriVision AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled",
        "health": "/health"
    }


# ===========================================
# Main Entry Point
# ===========================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS if not settings.DEBUG else 1,
        log_level="debug" if settings.DEBUG else "info"
    )
