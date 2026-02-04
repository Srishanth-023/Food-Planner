"""
Logging Configuration for AI Service

Sets up structured logging with JSON formatting
for production and human-readable format for development.
"""

import logging
import sys
from typing import Any
import structlog

from app.config import settings


def setup_logging():
    """Configure logging for the application."""
    
    # Set log level
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Configure structlog processors
    shared_processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]
    
    if settings.LOG_FORMAT == "json":
        # JSON formatting for production
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ]
    else:
        # Human-readable format for development
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )
    
    # Set levels for noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    
    return structlog.get_logger()


def get_logger(name: str = None) -> Any:
    """Get a logger instance."""
    return structlog.get_logger(name) if name else structlog.get_logger()
