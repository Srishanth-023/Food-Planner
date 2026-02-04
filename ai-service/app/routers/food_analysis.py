"""
Food Analysis Router

API endpoints for food image analysis,
detection, and portion estimation.
"""

import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from pydantic import BaseModel

from app.config import settings
from app.services.food_detection import FoodDetectionService

logger = logging.getLogger(__name__)

router = APIRouter()


class AnalysisResponse(BaseModel):
    """Response model for food analysis."""
    detected_foods: list
    portion_estimates: dict
    image_dimensions: dict


@router.post("/analyze-image", response_model=AnalysisResponse)
async def analyze_food_image(
    request: Request,
    image: UploadFile = File(...),
    include_portion_estimate: bool = True
):
    """
    Analyze a food image to detect foods and estimate portions.
    
    - **image**: Food image file (JPEG, PNG, WebP)
    - **include_portion_estimate**: Whether to estimate portion sizes
    
    Returns detected foods with confidence scores, bounding boxes,
    and estimated portion sizes in grams.
    """
    # Validate file type
    if image.content_type not in settings.allowed_image_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_IMAGE_TYPES}"
        )
    
    # Validate file size
    contents = await image.read()
    if len(contents) > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_IMAGE_SIZE / (1024*1024)}MB"
        )
    
    try:
        # Get model loader from app state
        model_loader = request.app.state.model_loader
        
        # Initialize food detection service
        detection_service = FoodDetectionService(model_loader)
        
        # Analyze image
        result = await detection_service.analyze_image(
            contents,
            include_portion_estimate=include_portion_estimate
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Food analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Food analysis failed: {str(e)}"
        )


@router.post("/portion-estimate")
async def estimate_portion(
    request: Request,
    image: UploadFile = File(...),
    food_name: str = None
):
    """
    Estimate portion size for a specific food in the image.
    
    - **image**: Food image file
    - **food_name**: Name of the food to estimate portion for
    
    Returns estimated portion size in grams.
    """
    contents = await image.read()
    
    try:
        model_loader = request.app.state.model_loader
        detection_service = FoodDetectionService(model_loader)
        
        result = await detection_service.analyze_image(contents)
        
        if food_name and food_name in result['portion_estimates']:
            return {
                'food_name': food_name,
                'estimated_grams': result['portion_estimates'][food_name]
            }
        
        return {
            'portion_estimates': result['portion_estimates']
        }
        
    except Exception as e:
        logger.error(f"Portion estimation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Portion estimation failed: {str(e)}"
        )
