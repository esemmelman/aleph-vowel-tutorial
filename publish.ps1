$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
git add -- index.html style.css app.js audio-map.js audio generate-audio.py README.md publish.ps1 .github
if ($LASTEXITCODE -ne 0) { throw 'Could not stage changes.' }
git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
  git commit -m 'Update Hebrew vowel tutorial'
  if ($LASTEXITCODE -ne 0) { throw 'Could not commit changes.' }
}
git push origin main
if ($LASTEXITCODE -ne 0) { throw 'Could not push to GitHub.' }
