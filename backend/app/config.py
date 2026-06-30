from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_port: int = 8110
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "world_animation"

    # 白名单访问（WHITELIST_ENABLED=true 时生效）
    whitelist_enabled: bool = False
    whitelist_ips: str = "127.0.0.1,::1"
    whitelist_origins: str = "http://localhost:2500,http://127.0.0.1:2500"
    trust_proxy: bool = False

    @property
    def whitelist_ips_list(self) -> list[str]:
        if not self.whitelist_ips.strip():
            return []
        return [item.strip() for item in self.whitelist_ips.split(",") if item.strip()]

    @property
    def whitelist_origins_list(self) -> list[str]:
        if not self.whitelist_origins.strip():
            return []
        return [item.strip().rstrip("/") for item in self.whitelist_origins.split(",") if item.strip()]

    @property
    def cors_origins(self) -> list[str]:
        if self.whitelist_enabled and self.whitelist_origins_list:
            return self.whitelist_origins_list
        return ["*"]

    @property
    def database_url(self) -> str:
        return (
            f"mysql+asyncmy://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            f"?charset=utf8mb4"
        )


settings = Settings()
