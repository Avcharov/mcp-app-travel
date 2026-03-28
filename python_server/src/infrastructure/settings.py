from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='APP_')

    LOG_LEVEL: str = "INFO"
    NAME: str = "python_server"
    DEBUG: bool = False
    ROOT_DIR: str = str(Path(__file__).parent)


class HTTPSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='HTTP_')

    PORT: int = 8080
    HOST: str = '0.0.0.0'
    WORKERS: int = 2


class GoogleMapSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='GOOGLE_MAP_')

    API_TOKEN: str


app_settings = AppSettings()
http_settings = HTTPSettings()
google_map_settings = GoogleMapSettings()
