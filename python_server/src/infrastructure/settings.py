from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='APP_')

    LOG_LEVEL: str = "INFO"
    NAME: str = "python_server"
    DEBUG: bool = False
    ROOT_DIR: str = str(Path(__file__).parent.parent)


class HTTPSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='HTTP_')

    PORT: int = 8080
    HOST: str = '0.0.0.0'
    WORKERS: int = 2


class GoogleSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='GOOGLE_MAP_')

    API_TOKEN: str


class LocationGuesserSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='LOCATION_GUESSER_')

    HOST: str


app_settings = AppSettings()
http_settings = HTTPSettings()
google_settings = GoogleSettings()
location_guesser_settings = LocationGuesserSettings()
