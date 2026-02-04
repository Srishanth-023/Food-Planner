"""
GenAI Service

Handles interactions with Large Language Models for:
- Natural language chat
- Meal plan generation
- Workout plan generation
- Quick nutrition queries
"""

import logging
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
import json

from app.config import settings
from app.services.prompts import PromptTemplates

logger = logging.getLogger(__name__)


class GenAIService:
    """Service for GenAI-powered features using LLM APIs."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.default_model = settings.DEFAULT_LLM_MODEL
        self.fallback_model = settings.FALLBACK_LLM_MODEL
        self.prompts = PromptTemplates()
    
    async def chat_completion(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a chat response based on user message and context.
        
        Args:
            message: User's message
            conversation_history: Previous messages in the conversation
            user_context: User profile, goals, and preferences
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            # Build system prompt with user context
            system_prompt = self.prompts.get_chat_system_prompt(user_context)
            
            # Prepare messages
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(conversation_history)
            messages.append({"role": "user", "content": message})
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.default_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            return {
                'response': response.choices[0].message.content,
                'model': response.model,
                'tokens_used': response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            logger.error(f"Chat completion error: {e}")
            # Try fallback model
            try:
                response = await self.client.chat.completions.create(
                    model=self.fallback_model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000
                )
                return {
                    'response': response.choices[0].message.content,
                    'model': response.model,
                    'tokens_used': response.usage.total_tokens if response.usage else 0
                }
            except Exception as fallback_error:
                logger.error(f"Fallback model error: {fallback_error}")
                raise
    
    async def generate_meal_plan(
        self,
        user_context: Dict[str, Any],
        days: int = 7,
        include_snacks: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a personalized meal plan.
        
        Args:
            user_context: User profile with goals and preferences
            days: Number of days to generate (1-7)
            include_snacks: Whether to include snack recommendations
            
        Returns:
            Dictionary with complete meal plan
        """
        try:
            system_prompt = self.prompts.get_meal_plan_system_prompt()
            user_prompt = self.prompts.get_meal_plan_user_prompt(
                user_context, days, include_snacks
            )
            
            response = await self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            # Parse JSON response
            meal_plan = json.loads(response.choices[0].message.content)
            
            return {
                'meal_plan': meal_plan,
                'model': response.model,
                'tokens_used': response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            logger.error(f"Meal plan generation error: {e}")
            raise
    
    async def generate_workout_plan(
        self,
        user_context: Dict[str, Any],
        days: int = 7,
        preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a personalized workout plan.
        
        Args:
            user_context: User profile with fitness goals
            days: Number of days to generate (1-7)
            preferences: Additional workout preferences
            
        Returns:
            Dictionary with complete workout plan
        """
        try:
            system_prompt = self.prompts.get_workout_plan_system_prompt()
            user_prompt = self.prompts.get_workout_plan_user_prompt(
                user_context, days, preferences
            )
            
            response = await self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            # Parse JSON response
            workout_plan = json.loads(response.choices[0].message.content)
            
            return {
                'workout_plan': workout_plan,
                'model': response.model,
                'tokens_used': response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            logger.error(f"Workout plan generation error: {e}")
            raise
    
    async def quick_query(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handle quick one-off queries without conversation context.
        
        Args:
            query: User's question
            user_context: Optional user context for personalization
            
        Returns:
            Dictionary with response
        """
        try:
            system_prompt = self.prompts.get_quick_query_prompt(user_context)
            
            response = await self.client.chat.completions.create(
                model=self.fallback_model,  # Use faster model for quick queries
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.5,
                max_tokens=500
            )
            
            return {
                'response': response.choices[0].message.content,
                'model': response.model
            }
            
        except Exception as e:
            logger.error(f"Quick query error: {e}")
            raise
    
    async def quick_meal_suggestion(
        self,
        meal_type: str,
        max_calories: int,
        diet_type: str,
        exclude_ingredients: List[str],
        allergies: List[str]
    ) -> Dict[str, Any]:
        """
        Generate quick meal suggestions based on criteria.
        
        Args:
            meal_type: Type of meal (breakfast, lunch, dinner, snack)
            max_calories: Maximum calories for the meal
            diet_type: Dietary preference (vegan, vegetarian, etc.)
            exclude_ingredients: Foods to exclude
            allergies: Known allergies
            
        Returns:
            Dictionary with meal suggestions
        """
        try:
            prompt = self.prompts.get_quick_meal_prompt(
                meal_type, max_calories, diet_type,
                exclude_ingredients, allergies
            )
            
            response = await self.client.chat.completions.create(
                model=self.fallback_model,
                messages=[
                    {"role": "system", "content": "You are a nutrition expert providing meal suggestions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            suggestions = json.loads(response.choices[0].message.content)
            
            return {
                'suggestions': suggestions.get('meals', []),
                'model': response.model
            }
            
        except Exception as e:
            logger.error(f"Quick meal suggestion error: {e}")
            raise
