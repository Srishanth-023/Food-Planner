"""
Plan Generation Router

API endpoints for generating meal plans
and workout plans using GenAI.
"""

import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.genai_service import GenAIService

logger = logging.getLogger(__name__)

router = APIRouter()
genai_service = GenAIService()


class MealPlanInput(BaseModel):
    """Input model for meal plan generation."""
    user_context: Dict[str, Any] = Field(...)
    days: int = Field(default=7, ge=1, le=7)
    include_snacks: bool = Field(default=True)


class WorkoutPlanInput(BaseModel):
    """Input model for workout plan generation."""
    user_context: Dict[str, Any] = Field(...)
    days: int = Field(default=7, ge=1, le=7)
    preferences: Optional[Dict[str, Any]] = Field(default=None)


class QuickMealInput(BaseModel):
    """Input model for quick meal suggestions."""
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    max_calories: int = Field(default=500, ge=100, le=2000)
    diet_type: str = Field(default="omnivore")
    exclude_ingredients: List[str] = Field(default=[])
    allergies: List[str] = Field(default=[])


@router.post("/generate-meal-plan")
async def generate_meal_plan(input_data: MealPlanInput):
    """
    Generate a personalized meal plan.
    
    - **user_context**: User profile with goals and preferences
    - **days**: Number of days (1-7)
    - **include_snacks**: Whether to include snack recommendations
    
    Returns a complete meal plan with recipes, nutritional info,
    and grocery list.
    """
    try:
        result = await genai_service.generate_meal_plan(
            user_context=input_data.user_context,
            days=input_data.days,
            include_snacks=input_data.include_snacks
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Meal plan generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Meal plan generation failed: {str(e)}"
        )


@router.post("/generate-workout-plan")
async def generate_workout_plan(input_data: WorkoutPlanInput):
    """
    Generate a personalized workout plan.
    
    - **user_context**: User profile with fitness goals
    - **days**: Number of days (1-7)
    - **preferences**: Workout preferences (difficulty, equipment, etc.)
    
    Returns a complete workout plan with exercises, sets, reps,
    and progression tips.
    """
    try:
        result = await genai_service.generate_workout_plan(
            user_context=input_data.user_context,
            days=input_data.days,
            preferences=input_data.preferences
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Workout plan generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Workout plan generation failed: {str(e)}"
        )


@router.post("/quick-meal-suggestion")
async def quick_meal_suggestion(input_data: QuickMealInput):
    """
    Get quick meal suggestions based on criteria.
    
    - **meal_type**: Type of meal (breakfast, lunch, dinner, snack)
    - **max_calories**: Maximum calories per meal
    - **diet_type**: Dietary preference
    - **exclude_ingredients**: Foods to avoid
    - **allergies**: Known allergies
    
    Returns 3 meal suggestions matching the criteria.
    """
    try:
        result = await genai_service.quick_meal_suggestion(
            meal_type=input_data.meal_type,
            max_calories=input_data.max_calories,
            diet_type=input_data.diet_type,
            exclude_ingredients=input_data.exclude_ingredients,
            allergies=input_data.allergies
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Quick meal suggestion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Quick meal suggestion failed: {str(e)}"
        )
