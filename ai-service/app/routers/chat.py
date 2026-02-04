"""
Chat Router

API endpoints for GenAI chat interactions
and natural language queries.
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.genai_service import GenAIService

logger = logging.getLogger(__name__)

router = APIRouter()
genai_service = GenAIService()


class MessageInput(BaseModel):
    """Input model for chat messages."""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_history: List[Dict[str, str]] = Field(default=[])
    user_context: Dict[str, Any] = Field(default={})


class ChatResponse(BaseModel):
    """Response model for chat."""
    response: str
    model: str
    tokens_used: int


class QuickQueryInput(BaseModel):
    """Input model for quick queries."""
    query: str = Field(..., min_length=1, max_length=500)
    user_context: Optional[Dict[str, Any]] = None


@router.post("/chat", response_model=ChatResponse)
async def chat_completion(input_data: MessageInput):
    """
    Send a message to the NutriVision AI assistant.
    
    - **message**: User's message
    - **conversation_history**: Previous messages for context
    - **user_context**: User profile and preferences
    
    Returns AI-generated response based on user's nutrition
    and fitness context.
    """
    try:
        result = await genai_service.chat_completion(
            message=input_data.message,
            conversation_history=input_data.conversation_history,
            user_context=input_data.user_context
        )
        
        return ChatResponse(
            response=result['response'],
            model=result['model'],
            tokens_used=result['tokens_used']
        )
        
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat completion failed: {str(e)}"
        )


@router.post("/quick-query")
async def quick_query(input_data: QuickQueryInput):
    """
    Quick one-off query without conversation history.
    
    - **query**: User's question
    - **user_context**: Optional user context for personalization
    
    Returns concise answer to nutrition/fitness questions.
    """
    try:
        result = await genai_service.quick_query(
            query=input_data.query,
            user_context=input_data.user_context
        )
        
        return {
            'response': result['response'],
            'model': result['model']
        }
        
    except Exception as e:
        logger.error(f"Quick query error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Quick query failed: {str(e)}"
        )
