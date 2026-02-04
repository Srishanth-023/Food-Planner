"""
Prompt Templates for GenAI Service

Contains all prompt templates used for:
- Chat conversations
- Meal plan generation
- Workout plan generation
- Quick queries
"""

from typing import Dict, Any, List, Optional


class PromptTemplates:
    """Manages prompt templates for GenAI interactions."""
    
    def get_chat_system_prompt(self, user_context: Dict[str, Any]) -> str:
        """Generate system prompt for chat with user context."""
        
        # Extract user info
        profile = user_context.get('profile', {})
        goals = user_context.get('fitnessGoals', {})
        diet = user_context.get('dietaryPreferences', {})
        metrics = user_context.get('calculatedMetrics', {})
        
        return f"""You are NutriVision AI, an expert nutrition and fitness assistant. You provide personalized advice based on the user's profile and goals.

## User Profile
- Name: {profile.get('firstName', 'User')}
- Gender: {profile.get('gender', 'not specified')}
- Primary Goal: {goals.get('primaryGoal', 'general fitness')}
- Activity Level: {goals.get('activityLevel', 'moderate')}
- Diet Type: {diet.get('dietType', 'omnivore')}
- Allergies: {', '.join(diet.get('allergies', [])) or 'None'}

## Daily Targets
- Calories: {metrics.get('dailyCalorieTarget', 'Not calculated')} kcal
- Protein: {metrics.get('macroTargets', {}).get('protein', 'N/A')}g
- Carbs: {metrics.get('macroTargets', {}).get('carbs', 'N/A')}g
- Fat: {metrics.get('macroTargets', {}).get('fat', 'N/A')}g

## Guidelines
1. Always consider the user's dietary restrictions and allergies
2. Provide specific, actionable advice
3. Include nutritional information when suggesting foods
4. Be encouraging and supportive
5. If asked about medical conditions, recommend consulting a healthcare professional
6. Keep responses concise but informative
7. Use the user's name occasionally to personalize responses
8. When suggesting meals, consider their calorie and macro targets

## Response Style
- Friendly and supportive tone
- Use bullet points for lists
- Include emojis sparingly for engagement
- Provide reasoning for recommendations"""

    def get_meal_plan_system_prompt(self) -> str:
        """System prompt for meal plan generation."""
        
        return """You are an expert nutritionist creating personalized meal plans. Generate detailed, practical meal plans that:

1. Meet the user's calorie and macro targets
2. Respect dietary preferences and restrictions
3. Include variety and balanced nutrition
4. Use commonly available ingredients
5. Provide realistic portion sizes
6. Include nutritional information for each meal

Output your response as a valid JSON object with the following structure:
{
  "days": [
    {
      "day": 1,
      "dayName": "Monday",
      "meals": {
        "breakfast": {
          "name": "Meal name",
          "description": "Brief description",
          "ingredients": ["ingredient 1", "ingredient 2"],
          "nutrition": {
            "calories": 400,
            "protein": 25,
            "carbs": 45,
            "fat": 12
          },
          "prepTime": "15 mins"
        },
        "lunch": { ... },
        "dinner": { ... },
        "snacks": [{ ... }]
      },
      "dailyTotals": {
        "calories": 2000,
        "protein": 150,
        "carbs": 200,
        "fat": 70
      }
    }
  ],
  "weeklyAverage": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fat": 70
  },
  "groceryList": ["item 1", "item 2"],
  "tips": ["tip 1", "tip 2"]
}"""

    def get_meal_plan_user_prompt(
        self,
        user_context: Dict[str, Any],
        days: int,
        include_snacks: bool
    ) -> str:
        """Generate user prompt for meal plan request."""
        
        goals = user_context.get('fitnessGoals', {})
        diet = user_context.get('dietaryPreferences', {})
        metrics = user_context.get('calculatedMetrics', {})
        physical = user_context.get('physicalAttributes', {})
        
        return f"""Create a {days}-day personalized meal plan with the following requirements:

## User Stats
- Age: {physical.get('age', 'Unknown')}
- Weight: {physical.get('weight', 'Unknown')} kg
- Height: {physical.get('height', 'Unknown')} cm

## Goals
- Primary Goal: {goals.get('primaryGoal', 'general_fitness')}
- Target Weight: {goals.get('targetWeight', 'Not set')} kg
- Activity Level: {goals.get('activityLevel', 'moderately_active')}

## Daily Targets
- Calories: {metrics.get('dailyCalorieTarget', 2000)} kcal
- Protein: {metrics.get('macroTargets', {}).get('protein', 150)}g
- Carbs: {metrics.get('macroTargets', {}).get('carbs', 200)}g
- Fat: {metrics.get('macroTargets', {}).get('fat', 70)}g

## Dietary Preferences
- Diet Type: {diet.get('dietType', 'omnivore')}
- Allergies: {', '.join(diet.get('allergies', [])) or 'None'}
- Foods to Avoid: {', '.join(diet.get('dislikedFoods', [])) or 'None'}
- Preferred Cuisines: {', '.join(diet.get('preferredCuisines', [])) or 'Any'}

## Additional Requirements
- Include snacks: {'Yes' if include_snacks else 'No'}
- Meals should be practical and easy to prepare
- Include variety throughout the week
- Consider meal prep opportunities

Generate a complete {days}-day meal plan as JSON."""

    def get_workout_plan_system_prompt(self) -> str:
        """System prompt for workout plan generation."""
        
        return """You are an expert fitness coach creating personalized workout plans. Generate detailed, safe, and effective workout plans that:

1. Match the user's fitness level and goals
2. Include proper warm-up and cool-down
3. Provide clear exercise instructions
4. Balance muscle groups throughout the week
5. Include rest days for recovery
6. Specify sets, reps, and rest periods

Output your response as a valid JSON object with the following structure:
{
  "days": [
    {
      "day": 1,
      "dayName": "Monday",
      "focus": "Upper Body Strength",
      "duration": 45,
      "warmup": [
        {
          "exercise": "Jumping Jacks",
          "duration": "2 mins"
        }
      ],
      "exercises": [
        {
          "name": "Push-ups",
          "sets": 3,
          "reps": "12-15",
          "rest": "60 seconds",
          "instructions": "Keep core tight, lower chest to ground",
          "muscleGroups": ["chest", "triceps", "shoulders"]
        }
      ],
      "cooldown": [
        {
          "exercise": "Chest Stretch",
          "duration": "30 seconds each side"
        }
      ],
      "estimatedCaloriesBurn": 300
    }
  ],
  "weeklyOverview": {
    "totalWorkouts": 5,
    "restDays": 2,
    "focusAreas": ["strength", "cardio"],
    "estimatedWeeklyCaloriesBurn": 1500
  },
  "progressionTips": ["tip 1", "tip 2"],
  "equipmentNeeded": ["dumbbells", "resistance bands"]
}"""

    def get_workout_plan_user_prompt(
        self,
        user_context: Dict[str, Any],
        days: int,
        preferences: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate user prompt for workout plan request."""
        
        goals = user_context.get('fitnessGoals', {})
        physical = user_context.get('physicalAttributes', {})
        preferences = preferences or {}
        
        return f"""Create a {days}-day personalized workout plan with the following requirements:

## User Stats
- Age: {physical.get('age', 'Unknown')}
- Weight: {physical.get('weight', 'Unknown')} kg
- Height: {physical.get('height', 'Unknown')} cm

## Fitness Goals
- Primary Goal: {goals.get('primaryGoal', 'general_fitness')}
- Activity Level: {goals.get('activityLevel', 'moderately_active')}

## Preferences
- Difficulty: {preferences.get('difficulty', 'intermediate')}
- Include Rest Days: {preferences.get('includeRestDays', True)}
- Max Duration per Session: {preferences.get('maxDuration', 60)} minutes
- Available Equipment: {', '.join(preferences.get('availableEquipment', [])) or 'Basic (bodyweight, dumbbells)'}

## Goal-Specific Focus
{'- Focus on fat-burning exercises with high-intensity intervals' if goals.get('primaryGoal') == 'fat_loss' else ''}
{'- Focus on progressive overload and muscle building' if goals.get('primaryGoal') == 'muscle_gain' else ''}
{'- Focus on maintaining current fitness with balanced routine' if goals.get('primaryGoal') == 'maintenance' else ''}
{'- Focus on cardio and stamina building' if goals.get('primaryGoal') == 'endurance' else ''}

Generate a complete {days}-day workout plan as JSON."""

    def get_quick_query_prompt(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """System prompt for quick one-off queries."""
        
        context_info = ""
        if user_context:
            diet = user_context.get('dietaryPreferences', {})
            goals = user_context.get('fitnessGoals', {})
            context_info = f"""
User Context:
- Diet Type: {diet.get('dietType', 'omnivore')}
- Allergies: {', '.join(diet.get('allergies', [])) or 'None'}
- Fitness Goal: {goals.get('primaryGoal', 'general_fitness')}
"""
        
        return f"""You are NutriVision AI, a helpful nutrition and fitness assistant. Provide concise, accurate answers to questions about:
- Food nutrition
- Calories and macros
- Meal suggestions
- Exercise tips
- Healthy eating habits

{context_info}

Guidelines:
- Keep responses brief and to the point
- Include specific numbers when relevant (calories, grams, etc.)
- Recommend consulting healthcare professionals for medical advice
- Be encouraging and supportive"""

    def get_quick_meal_prompt(
        self,
        meal_type: str,
        max_calories: int,
        diet_type: str,
        exclude_ingredients: List[str],
        allergies: List[str]
    ) -> str:
        """Prompt for quick meal suggestions."""
        
        return f"""Suggest 3 {meal_type} options that meet these criteria:

- Maximum calories: {max_calories} kcal
- Diet type: {diet_type}
- Avoid these ingredients: {', '.join(exclude_ingredients) or 'None'}
- Allergies to avoid: {', '.join(allergies) or 'None'}

For each meal, include:
1. Meal name
2. Brief description
3. Estimated calories
4. Main ingredients
5. Protein, carbs, and fat content

Return as JSON:
{{
  "meals": [
    {{
      "name": "Meal name",
      "description": "Brief description",
      "calories": 400,
      "protein": 25,
      "carbs": 45,
      "fat": 12,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "prepTime": "15 mins"
    }}
  ]
}}"""
