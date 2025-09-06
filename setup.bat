@echo off
echo Setting up EcoFinds - Sustainable Second-Hand Marketplace
echo.

echo Installing backend dependencies...
cd ecofinds-backend
call yarn install
echo Backend dependencies installed!
echo.

echo Installing frontend dependencies...
cd ..\ecofinds-frontend
call yarn install
echo Frontend dependencies installed!
echo.

echo Setup complete!
echo.
echo To start the application:
echo 1. Open terminal 1 and run: cd ecofinds-backend && yarn run start
echo 2. Open terminal 2 and run: cd ecofinds-frontend && yarn run dev
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
pause