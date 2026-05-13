from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_token: str = "change-me"
    host: str = "0.0.0.0"
    port: int = 8420
    cors_origins: str = "*"
    process_scan_interval: int = 5
    screen_buffer_lines: int = 100

    model_config = {"env_prefix": "DASHBOARD_", "env_file": ".env"}


settings = Settings()
