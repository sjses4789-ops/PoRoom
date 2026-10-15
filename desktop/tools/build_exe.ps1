# Windows용 실행 파일(exe) 만들기:  powershell -ExecutionPolicy Bypass -File tools/build_exe.ps1
# 결과: dist/PoRoom/PoRoom.exe (이 폴더째로 배포한다 — env.json이 exe 옆에 같이 들어간다)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".venv")) { python -m venv .venv }
& .\.venv\Scripts\python.exe -m pip install -q -r requirements.txt pyinstaller
if (-not (Test-Path "env.json")) { & .\.venv\Scripts\python.exe tools\gen_env.py }

& .\.venv\Scripts\python.exe -m PyInstaller --noconfirm --clean --windowed --name PoRoom `
    --collect-submodules websockets `
    run.py
Copy-Item env.json dist\PoRoom\env.json -Force
Write-Host "완료: dist\PoRoom\PoRoom.exe"
