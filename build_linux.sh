#!/usr/bin/env bash

set -euo pipefail
rm -rf out build lib dist backend_src/dist backend_src/__pycache__
source venv/bin/activate
python -m PyInstaller pyinstaller.spec
mv dist backend_src/dist
npm run make
