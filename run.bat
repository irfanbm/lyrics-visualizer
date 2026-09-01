@echo off
setlocal
REM --- Pastikan Node.js ada di PATH (winget install ke C:\Program Files\nodejs) ---
set "NODE_DIR=C:\Program Files\nodejs"
echo %PATH% | find /I "%NODE_DIR%" >nul || set "PATH=%PATH%;%NODE_DIR%"

REM Pindah ke folder script ini (project root)
cd /d "%~dp0"

echo ========================================
echo  Lyric Visualizer - Spotify Style
echo  http://localhost:5173
echo ========================================
echo.

REM Cek node & npm
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js tidak ditemukan di PATH.
  echo Install Node.js LTS dari https://nodejs.org atau jalankan: winget install OpenJS.NodeJS.LTS
  pause
  exit /b 1
)

REM Install deps jika belum ada
if not exist "node_modules" (
  echo [INFO] node_modules belum ada, menginstall dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install gagal.
    pause
    exit /b 1
  )
)

echo [INFO] Menjalankan dev server...
echo [INFO] Browser akan terbuka otomatis dalam 4 detik...

REM Buka browser dengan delay 4 detik di background (tidak block npm)
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5173"

REM Jalankan Vite (blocking, biar window tetap hidup)
call npm run dev -- --host 0.0.0.0 --port 5173

REM Jika vite exit
echo.
echo [INFO] Dev server berhenti.
pause