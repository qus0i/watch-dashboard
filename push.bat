@echo off
cd /d "c:\Users\user\OneDrive - University Of Jordan\Desktop\AAA\watch-dashboard"
git init
git add -A
git commit -m "Initial commit: GPS Watch Dashboard"
git branch -M main
git remote add origin https://github.com/qus0i/watch-dashboard.git
git push -u origin main
echo DONE!
pause
