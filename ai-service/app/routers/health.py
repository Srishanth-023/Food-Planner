"""
Health Check Router

API endpoints for service health monitoring.
"""

from fastapi import APIRouter, Request
from datetime import datetime
import torch

from app.config import settings

router = APIRouter()


@router.get("")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "NutriVision AI Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/detailed")
async def detailed_health_check(request: Request):
    """Detailed health check with model status."""
    
    model_status = {}
    
    # Check model loader
    if hasattr(request.app.state, 'model_loader'):
        model_loader = request.app.state.model_loader
        model_status = {
            name: "loaded" for name, model in model_loader.models.items()
            if model is not None
        }
    
    # Check GPU availability
    gpu_info = {
        "cuda_available": torch.cuda.is_available(),
        "device": model_loader.device if hasattr(request.app.state, 'model_loader') else "unknown"
    }
    
    if torch.cuda.is_available():
        gpu_info["gpu_name"] = torch.cuda.get_device_name(0)
        gpu_info["gpu_memory_allocated"] = f"{torch.cuda.memory_allocated(0) / 1024**2:.2f} MB"
    
    return {
        "status": "healthy",
        "service": "NutriVision AI Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT,
        "models": model_status,
        "gpu": gpu_info,
        "config": {
            "llm_provider": settings.DEFAULT_LLM_PROVIDER,
            "llm_model": settings.DEFAULT_LLM_MODEL,
            "food_recognition_model": settings.FOOD_RECOGNITION_MODEL
        }
    }


@router.get("/ready")
async def readiness_check(request: Request):
    """Readiness probe for Kubernetes."""
    
    # Check if models are loaded
    if not hasattr(request.app.state, 'model_loader'):
        return {"ready": False, "reason": "Models not initialized"}
    
    model_loader = request.app.state.model_loader
    
    # Check critical models
    if model_loader.get_model('food_recognition') is None:
        return {"ready": False, "reason": "Food recognition model not loaded"}
    
    return {"ready": True}


@router.get("/live")
async def liveness_check():
    """Liveness probe for Kubernetes."""
    return {"alive": True}
