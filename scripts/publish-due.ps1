<#
    流萤动态博客：定时发布兜底脚本（Windows Server）
    用法：powershell -ExecutionPolicy Bypass -File .\scripts\publish-due.ps1
    建议计划任务：每 5 分钟运行一次
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ProjectDir ".env"

# 读取 .env 中的键值（去掉两侧引号，取最后一次出现）
function Read-EnvValue {
    param([string]$Key)
    if (-not (Test-Path -LiteralPath $EnvFile)) {
        return $null
    }
    $line = Get-Content -LiteralPath $EnvFile | Where-Object { $_ -match "^$Key=" } | Select-Object -Last 1
    if (-not $line) {
        return $null
    }
    return ($line -replace "^$Key=", "").Trim().Trim('"').Trim("'")
}

$siteUrl = Read-EnvValue "SITE_URL"
$cronSecret = Read-EnvValue "CRON_SECRET"
if ([string]::IsNullOrWhiteSpace($siteUrl) -or [string]::IsNullOrWhiteSpace($cronSecret)) {
    throw "缺少 SITE_URL 或 CRON_SECRET，请检查 $EnvFile"
}

$response = Invoke-RestMethod -Uri "$siteUrl/api/tasks/publish-due" -Method Get `
    -Headers @{ "x-cron-secret" = $cronSecret } -TimeoutSec 30

Write-Output ($response | ConvertTo-Json -Compress)
