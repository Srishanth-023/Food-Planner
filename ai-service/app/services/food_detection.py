"""
Food Detection Service

Handles food image analysis using YOLOv8 model,
detecting foods and estimating portions.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from PIL import Image
import io
import cv2

from app.config import settings

logger = logging.getLogger(__name__)


# Common food classes for YOLO (you may need to fine-tune or use a food-specific model)
FOOD_CLASSES = {
    # These would be replaced with actual food-specific class mappings
    # from a fine-tuned model on food datasets like Food-101
    'apple': {'calories_per_100g': 52, 'default_weight': 182},
    'banana': {'calories_per_100g': 89, 'default_weight': 118},
    'orange': {'calories_per_100g': 47, 'default_weight': 131},
    'pizza': {'calories_per_100g': 266, 'default_weight': 107},
    'hamburger': {'calories_per_100g': 295, 'default_weight': 226},
    'sandwich': {'calories_per_100g': 250, 'default_weight': 150},
    'salad': {'calories_per_100g': 20, 'default_weight': 200},
    'rice': {'calories_per_100g': 130, 'default_weight': 158},
    'pasta': {'calories_per_100g': 131, 'default_weight': 140},
    'chicken': {'calories_per_100g': 239, 'default_weight': 140},
    'steak': {'calories_per_100g': 271, 'default_weight': 221},
    'fish': {'calories_per_100g': 206, 'default_weight': 154},
    'egg': {'calories_per_100g': 155, 'default_weight': 50},
    'bread': {'calories_per_100g': 265, 'default_weight': 30},
    'cake': {'calories_per_100g': 257, 'default_weight': 80},
    'cookie': {'calories_per_100g': 502, 'default_weight': 30},
    'soup': {'calories_per_100g': 40, 'default_weight': 240},
    'coffee': {'calories_per_100g': 2, 'default_weight': 240},
    'juice': {'calories_per_100g': 45, 'default_weight': 240},
    'milk': {'calories_per_100g': 42, 'default_weight': 244},
}


class FoodDetectionService:
    """Service for detecting foods in images using computer vision."""
    
    def __init__(self, model_loader):
        self.model_loader = model_loader
        self.confidence_threshold = settings.FOOD_RECOGNITION_CONFIDENCE
    
    async def analyze_image(
        self,
        image_data: bytes,
        include_portion_estimate: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze a food image and detect foods with their portions.
        
        Args:
            image_data: Raw image bytes
            include_portion_estimate: Whether to estimate portion sizes
            
        Returns:
            Dictionary with detected foods and portions
        """
        try:
            # Load and preprocess image
            image = Image.open(io.BytesIO(image_data))
            image_np = np.array(image)
            
            # Get food recognition model
            food_model = self.model_loader.get_model('food_recognition')
            
            if food_model is None:
                raise ValueError("Food recognition model not loaded")
            
            # Run detection
            results = food_model(image_np, conf=self.confidence_threshold)
            
            # Process results
            detected_foods = []
            portion_estimates = {}
            
            for result in results:
                boxes = result.boxes
                
                if boxes is None or len(boxes) == 0:
                    continue
                
                for box in boxes:
                    # Get class name and confidence
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0])
                    
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    # Map to food if possible
                    food_name = self._map_to_food_class(class_name)
                    
                    if food_name:
                        food_info = {
                            'name': food_name,
                            'confidence': round(confidence, 3),
                            'bounding_box': {
                                'x': int(x1),
                                'y': int(y1),
                                'width': int(x2 - x1),
                                'height': int(y2 - y1)
                            }
                        }
                        
                        detected_foods.append(food_info)
                        
                        # Estimate portion size
                        if include_portion_estimate:
                            portion = await self._estimate_portion(
                                image_np,
                                food_name,
                                (x1, y1, x2, y2)
                            )
                            portion_estimates[food_name] = portion
            
            return {
                'detected_foods': detected_foods,
                'portion_estimates': portion_estimates,
                'image_dimensions': {
                    'width': image.width,
                    'height': image.height
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            raise
    
    def _map_to_food_class(self, detected_class: str) -> Optional[str]:
        """Map detected class to known food class."""
        # Direct mapping
        detected_lower = detected_class.lower()
        
        if detected_lower in FOOD_CLASSES:
            return detected_lower
        
        # Fuzzy mapping for common variations
        mappings = {
            'hot dog': 'hotdog',
            'french fries': 'fries',
            'doughnut': 'donut',
            'cup': 'coffee',  # Could be a beverage
            'bowl': 'soup',   # Could be soup or salad
            'plate': None,    # Generic, skip
        }
        
        return mappings.get(detected_lower, detected_lower)
    
    async def _estimate_portion(
        self,
        image: np.ndarray,
        food_name: str,
        bbox: Tuple[float, float, float, float]
    ) -> float:
        """
        Estimate portion size in grams.
        
        Uses a combination of:
        1. Bounding box area relative to image
        2. Default portion sizes for known foods
        3. Optional depth estimation for 3D volume
        """
        x1, y1, x2, y2 = bbox
        
        # Calculate area relative to image
        image_area = image.shape[0] * image.shape[1]
        food_area = (x2 - x1) * (y2 - y1)
        area_ratio = food_area / image_area
        
        # Get default weight for this food
        if food_name in FOOD_CLASSES:
            default_weight = FOOD_CLASSES[food_name]['default_weight']
        else:
            default_weight = 100  # Default to 100g
        
        # Scale based on area (simplified estimation)
        # Assumes typical food takes up ~15-20% of frame
        typical_ratio = 0.15
        scale_factor = area_ratio / typical_ratio
        
        # Clamp to reasonable range
        scale_factor = max(0.5, min(2.0, scale_factor))
        
        estimated_weight = default_weight * scale_factor
        
        # Try depth-based estimation if available
        depth_model = self.model_loader.get_model('depth_estimation')
        if depth_model is not None:
            try:
                depth_estimate = await self._depth_based_estimation(
                    image, bbox, depth_model
                )
                if depth_estimate:
                    # Blend with area-based estimate
                    estimated_weight = (estimated_weight + depth_estimate) / 2
            except Exception as e:
                logger.warning(f"Depth estimation failed: {e}")
        
        return round(estimated_weight, 1)
    
    async def _depth_based_estimation(
        self,
        image: np.ndarray,
        bbox: Tuple[float, float, float, float],
        depth_model: Dict[str, Any]
    ) -> Optional[float]:
        """
        Use depth estimation to improve portion sizing.
        
        This provides 3D volume estimation based on
        depth map analysis.
        """
        import torch
        
        model = depth_model['model']
        transform = depth_model['transform']
        
        # Convert to RGB if needed
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        
        # Transform image
        input_batch = transform(image)
        
        # Move to device
        device = next(model.parameters()).device
        input_batch = input_batch.to(device)
        
        # Run inference
        with torch.no_grad():
            prediction = model(input_batch)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=image.shape[:2],
                mode="bicubic",
                align_corners=False,
            ).squeeze()
        
        depth_map = prediction.cpu().numpy()
        
        # Extract depth in bounding box region
        x1, y1, x2, y2 = [int(v) for v in bbox]
        food_depth = depth_map[y1:y2, x1:x2]
        
        # Calculate approximate volume
        avg_depth = np.mean(food_depth)
        area = (x2 - x1) * (y2 - y1)
        
        # Normalize depth (MiDaS outputs relative depth)
        normalized_depth = avg_depth / np.max(depth_map)
        
        # Estimate volume (simplified)
        volume_factor = area * normalized_depth
        
        # Convert to grams (very approximate)
        # This would need calibration with known reference objects
        estimated_grams = volume_factor * 0.001  # Calibration factor
        
        return estimated_grams if estimated_grams > 10 else None
