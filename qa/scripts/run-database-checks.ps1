param(
    [string]$ContainerName = 'demo-postgres'
)

$ErrorActionPreference = 'Stop'
$sqlPath = Join-Path $PSScriptRoot '..\database\assert-integrity.sql'
$sql = Get-Content -Raw -Path $sqlPath

$sql | & docker exec -i $ContainerName psql -U postgres -d demo_app -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) {
    throw "Database assertions failed with exit code $LASTEXITCODE."
}
