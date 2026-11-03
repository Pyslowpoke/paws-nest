param(
  [Parameter(Mandatory=$true)][string]$NsisCompiler,
  [Parameter(Mandatory=$true)][string]$ClientDirectory,
  [Parameter(Mandatory=$true)][string]$OutputFile
)
$ErrorActionPreference='Stop'
$compiler=(Resolve-Path -LiteralPath $NsisCompiler).Path
$client=(Resolve-Path -LiteralPath $ClientDirectory).Path
$output=[System.IO.Path]::GetFullPath($OutputFile)
foreach($required in @('PawsNest.exe','resources/app.asar','使用说明.html')) {
  if(!(Test-Path -LiteralPath (Join-Path $client $required))){throw "Client payload missing: $required"}
}
& $compiler /INPUTCHARSET UTF8 /V3 "/DCLIENT_DIR=$client" "/DOUTPUT_FILE=$output" (Join-Path $PSScriptRoot 'portable.nsi')
if($LASTEXITCODE -ne 0){throw 'Portable packaging failed'}
Get-Item -LiteralPath $output | Select-Object Name,Length
Get-FileHash -LiteralPath $output -Algorithm SHA256
