import logging
import sys

from infrastructure.settings import app_settings


class ColorFormatter(logging.Formatter):
    RESET = "\033[0m"
    BLUE_LIGHT = "\033[94m"
    GREEN = "\033[32m"

    LEVEL_COLORS = {
        logging.DEBUG: "\033[37m",  # white
        logging.INFO: "\033[34m",  # blue
        logging.WARNING: "\033[33m",  # yellow
        logging.ERROR: "\033[31m",  # red
        logging.CRITICAL: "\033[31m",  # red
    }

    def format(self, record: logging.LogRecord) -> str:
        time = f"{self.GREEN}{self.formatTime(record, "%H:%M:%S")}{self.RESET}"

        level_color = self.LEVEL_COLORS.get(record.levelno, "")
        level = f"{level_color}{record.levelname}{self.RESET}"

        module = f"{self.BLUE_LIGHT}{record.name}{self.RESET}"

        return f"{time} | {level} | {module} | {record.getMessage()}"


def configure_logging():
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(ColorFormatter())

    logger = logging.getLogger()
    logger.setLevel(app_settings.LOG_LEVEL)
    logger.addHandler(handler)
