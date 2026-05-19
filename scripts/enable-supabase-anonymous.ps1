# Enables anonymous sign-in on the Bloomlog Supabase project via Management API.
# Requires: SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens

$ErrorActionPreference = "Stop"
$projectRef = "curzpvrglfdlujvffvex"
$token = $env:SUPABASE_ACCESS_TOKEN

if (-not $token) {
  Write-Host "Set SUPABASE_ACCESS_TOKEN first, then re-run this script."
  Write-Host "Or enable manually: https://supabase.com/dashboard/project/$projectRef/auth/providers"
  exit 1
}

$body = @{ external_anonymous_users_enabled = $true } | ConvertTo-Json
$response = Invoke-RestMethod `
  -Method PATCH `
  -Uri "https://api.supabase.com/v1/projects/$projectRef/config/auth" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body

Write-Host "Anonymous sign-ins enabled for project $projectRef"
