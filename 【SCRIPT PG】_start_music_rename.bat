@echo off
setlocal enabledelayedexpansion

pushd ..

set rootDi=%cd%
popd

node .\main.js


echo fin

pause

exit
