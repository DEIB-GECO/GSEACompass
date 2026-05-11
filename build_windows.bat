@echo off
rmdir /s /q out 2>nul
rmdir /s /q build 2>nul
rmdir /s /q lib 2>nul
rmdir /s /q backend_src\dist 2>nul
rmdir /s /q backend_src\__pycache__ 2>nul
call venv\Scripts\activate.bat
python -m PyInstaller pyinstaller.spec
move dist backend_src\dist
npm run make
