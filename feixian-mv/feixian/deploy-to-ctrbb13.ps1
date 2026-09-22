# Deploy feixian MVP onto DESKTOP-CTRBB13
# Run on CTRBB13 from a copy of this repo, OR after extracting feixian-mvp.zip
$ErrorActionPreference = "Stop"
$Dest = "E:\wx-game\feixian-mv\feixian"
$UiDest = "E:\wx-game\assets\ui"
$Src = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $Src "package.json"))) {
  Write-Error "Run this script from the extracted feixian project folder (contains package.json)"
}
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
New-Item -ItemType Directory -Force -Path $UiDest | Out-Null
# copy project files
robocopy $Src $Dest /E /XD library temp local build native .git /NFL /NDL /NJH /NJS | Out-Null
# copy wireframes
$UiRef = Join-Path $Src "assets\ui-ref"
if (Test-Path $UiRef) {
  Copy-Item (Join-Path $UiRef "*") $UiDest -Force
}
Write-Host "Deployed to $Dest"
Write-Host "Wireframes -> $UiDest"
Write-Host "Open with: E:\Cocos\Creator\3.8.7\CocosCreator.exe --project $Dest"
