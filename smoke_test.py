import importlib
import os

MODULES = ["ingestor", "brain", "narrator", "interfaces", "vantage_llm"]


def run() -> None:
    for module_name in MODULES:
        importlib.import_module(module_name)
        print(f"ok: import {module_name}")

    required_env = ["GEMINI_API_KEY"]
    missing = [key for key in required_env if not os.getenv(key)]
    if missing:
        print(f"warning: missing env vars for runtime calls: {missing}")


if __name__ == "__main__":
    run()
