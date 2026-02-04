"""
Configuration Settings for AI Service

Uses Pydantic Settings for environment variable management
with validation and type casting.
"""

from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server Configuration
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    WORKERS: int = Field(default=1)
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    
    # Model Configuration
    DEFAULT_LLM_PROVIDER: str = Field(default="openai")
    DEFAULT_LLM_MODEL: str = Field(default="gpt-4-turbo-preview")
    FALLBACK_LLM_MODEL: str = Field(default="gpt-3.5-turbo")
    
    # Food Recognition
    FOOD_RECOGNITION_MODEL: str = Field(default="yolov8n.pt")
    FOOD_RECOGNITION_CONFIDENCE: float = Field(default=0.5)
    
    # Portion Estimation
    PORTION_ESTIMATION_METHOD: str = Field(default="reference_object")
    DEPTH_ESTIMATION_MODEL: str = Field(default="MiDaS_small")
    
    # Database
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_DB: str = Field(default="nutrivision_nutrition")
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: str = Field(default="")
    DATABASE_URL: Optional[str] = Field(default=None)
    
    MONGODB_URI: str = Field(default="mongodb://localhost:27017/nutrivision")
    REDIS_URL: str = Field(default="redis://localhost:6379")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100)
    RATE_LIMIT_WINDOW: int = Field(default=60)
    
    # File Upload
    MAX_IMAGE_SIZE: int = Field(default=10485760)  # 10MB
    ALLOWED_IMAGE_TYPES: str = Field(default="image/jpeg,image/png,image/webp")
    
    # Logging
    LOG_LEVEL: str = Field(default="DEBUG")
    LOG_FORMAT: str = Field(default="json")
    
    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:5000")
    
    # Model Cache
    MODEL_CACHE_DIR: str = Field(default="./models")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    @property
    def database_url(self) -> str:
        """Construct database URL if not provided."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def allowed_image_types_list(self) -> list:
        """Get allowed image types as a list."""
        return self.ALLOWED_IMAGE_TYPES.split(",")


# Global settings instance
settings = Settings()
