"""
ML Model Loader Service

Handles loading and caching of machine learning models
for food recognition and portion estimation.
"""

import os
import logging
from typing import Optional, Dict, Any
import torch
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)


class ModelLoader:
    """
    Manages loading and unloading of ML models.
    Implements singleton pattern for model caching.
    """
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.device = self._get_device()
        self.model_cache_dir = Path(settings.MODEL_CACHE_DIR)
        self.model_cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_device(self) -> str:
        """Determine the best available device for model inference."""
        if torch.cuda.is_available():
            device = "cuda"
            logger.info(f"Using CUDA device: {torch.cuda.get_device_name(0)}")
        elif torch.backends.mps.is_available():
            device = "mps"
            logger.info("Using Apple MPS device")
        else:
            device = "cpu"
            logger.info("Using CPU device")
        return device
    
    async def load_models(self):
        """Load all required models."""
        await self._load_food_recognition_model()
        await self._load_depth_estimation_model()
        logger.info("All models loaded successfully")
    
    async def _load_food_recognition_model(self):
        """Load YOLOv8 model for food recognition."""
        try:
            from ultralytics import YOLO
            
            model_path = self.model_cache_dir / settings.FOOD_RECOGNITION_MODEL
            
            # Download model if not exists
            if not model_path.exists():
                logger.info(f"Downloading food recognition model: {settings.FOOD_RECOGNITION_MODEL}")
                # YOLO will automatically download the model
                model = YOLO(settings.FOOD_RECOGNITION_MODEL)
            else:
                model = YOLO(str(model_path))
            
            # Move to appropriate device
            model.to(self.device)
            
            self.models['food_recognition'] = model
            logger.info(f"Food recognition model loaded: {settings.FOOD_RECOGNITION_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to load food recognition model: {e}")
            raise
    
    async def _load_depth_estimation_model(self):
        """Load MiDaS model for depth estimation (used in portion sizing)."""
        try:
            # MiDaS model for depth estimation
            model_type = settings.DEPTH_ESTIMATION_MODEL
            
            midas = torch.hub.load(
                "intel-isl/MiDaS",
                model_type,
                trust_repo=True
            )
            midas.to(self.device)
            midas.eval()
            
            # Load transforms
            midas_transforms = torch.hub.load(
                "intel-isl/MiDaS",
                "transforms",
                trust_repo=True
            )
            
            if "DPT" in model_type:
                transform = midas_transforms.dpt_transform
            else:
                transform = midas_transforms.small_transform
            
            self.models['depth_estimation'] = {
                'model': midas,
                'transform': transform
            }
            
            logger.info(f"Depth estimation model loaded: {model_type}")
            
        except Exception as e:
            logger.warning(f"Failed to load depth estimation model: {e}")
            # Non-critical, continue without depth estimation
            self.models['depth_estimation'] = None
    
    def get_model(self, model_name: str) -> Optional[Any]:
        """Get a loaded model by name."""
        return self.models.get(model_name)
    
    async def unload_models(self):
        """Unload all models and free memory."""
        for name, model in self.models.items():
            if model is not None:
                del model
                logger.info(f"Unloaded model: {name}")
        
        self.models.clear()
        
        # Clear GPU cache if using CUDA
        if self.device == "cuda":
            torch.cuda.empty_cache()
        
        logger.info("All models unloaded")
