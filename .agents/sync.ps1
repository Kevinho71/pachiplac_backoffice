# Sincroniza las skills pertinentes desde ~/.agents/skills hacia .agents/skills
# Uso:  pwsh -File .agents\sync.ps1   (o  .\.agents\sync.ps1)

$skills = @(
  'gitflow-workflow',
  'cicd-pipelines',
  'docker-local-db',
  'postgresql',
  'nestjs-best-practices',
  'vitest-unit-testing',
  'shadcn',
  'ui-styling',
  'ui-ux-pro-max',
  'design-taste-frontend',
  'refero-design',
  'impeccable',
  'vercel-react-best-practices',
  'gh'
)

$src = "$env:USERPROFILE\.agents\skills"
$dst = Join-Path $PSScriptRoot "skills"

foreach ($s in $skills) {
  $from = Join-Path $src $s
  $to   = Join-Path $dst $s
  if (Test-Path $from) {
    # Borra la copia local y vuelve a copiar (sincroniza cambios y borrados)
    if (Test-Path $to) { Remove-Item $to -Recurse -Force }
    robocopy $from $to /E /NFL /NDL /NJH /NJS /NP | Out-Null
    Write-Output "OK   $s"
  } else {
    Write-Output "FALTA (no existe en ~/.agents/skills): $s"
  }
}
