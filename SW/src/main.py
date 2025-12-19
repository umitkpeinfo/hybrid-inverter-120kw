"""
120kW Hybrid Inverter Monitoring Software
Main Application Entry Point
"""

import sys
import os
import yaml
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gui import InverterMonitorApp


def setup_logging():
    """Configure logging"""
    log_dir = Path("./logs")
    log_dir.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / "monitor.log"),
            logging.StreamHandler()
        ]
    )


def load_config() -> dict:
    """Load configuration from YAML file"""
    config_path = Path(__file__).parent.parent / "config.yaml"
    
    if config_path.exists():
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    else:
        logging.warning(f"Config file not found: {config_path}")
        return {}


def main():
    """Main entry point"""
    setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("=" * 60)
    logger.info("120kW Hybrid Inverter Monitor v2.1")
    logger.info("=" * 60)
    
    # Load configuration
    config = load_config()
    
    # Create and run application
    app = InverterMonitorApp(config)
    app.run()


if __name__ == "__main__":
    main()

