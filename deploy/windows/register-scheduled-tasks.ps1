<#
    流萤动态博客：Windows Server 计划任务注册脚本
    作用：注册「定时发布兜底」与「数据库每日备份」两个计划任务。
    用法（需以管理员身份运行 PowerShell）：
      powershell -ExecutionPolicy Bypass -File .\deploy\windows\register-scheduled-tasks.ps1
    可选参数：
      -MysqldumpPath  mysqldump.exe 的完整路径（SYSTEM 账号的 PATH 通常没有 MySQL，建议显式指定）
      -KeepDays       备份保留天数，默认 14 天
      -TaskUser       计划任务运行账号，默认 SYSTEM（无需登录即可运行）
    说明：脚本可重复执行，同名任务会被覆盖更新。
#>
[CmdletBinding()]
param(
    [string]$MysqldumpPath = "mysqldump",
    [int]$KeepDays = 14,
    [string]$TaskUser = "SYSTEM"
)

$ErrorActionPreference = "Stop"

# 注册计划任务需要管理员权限
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "请以管理员身份运行本脚本后再注册计划任务"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = (Resolve-Path -LiteralPath (Join-Path $ScriptDir "../..")).Path
$PublishScript = Join-Path $ProjectDir "scripts/publish-due.ps1"
$BackupScript = Join-Path $ProjectDir "scripts/backup-db.ps1"

foreach ($path in @($PublishScript, $BackupScript)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "未找到脚本：$path"
    }
}

# 计划任务统一使用 powershell.exe 执行脚本，隐藏窗口并跳过执行策略限制
function New-FireflyAction {
    param([string]$Arguments)
    return New-ScheduledTaskAction -Execute "powershell.exe" -Argument $Arguments
}

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# 1) 定时发布兜底：每 5 分钟执行一次，持续 10 年
$publishAction = New-FireflyAction -Arguments "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PublishScript`""
$publishTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
Register-ScheduledTask -TaskName "FireflyPublishDue" -Action $publishAction -Trigger $publishTrigger `
    -Settings $settings -User $TaskUser -Description "流萤动态博客：到点发布定时文章" -Force | Out-Null
Write-Output "已注册计划任务：FireflyPublishDue（每 5 分钟）"

# 2) 数据库备份：每天凌晨 3 点执行
$backupArguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$BackupScript`" -KeepDays $KeepDays -MysqldumpPath `"$MysqldumpPath`""
$backupAction = New-FireflyAction -Arguments $backupArguments
$backupTrigger = New-ScheduledTaskTrigger -Daily -At "03:00"
Register-ScheduledTask -TaskName "FireflyDbBackup" -Action $backupAction -Trigger $backupTrigger `
    -Settings $settings -User $TaskUser -Description "流萤动态博客：MySQL 数据库每日备份" -Force | Out-Null
Write-Output "已注册计划任务：FireflyDbBackup（每天 03:00，保留 $KeepDays 天）"

Write-Output "如需立即验证，可执行：Start-ScheduledTask -TaskName FireflyPublishDue, FireflyDbBackup"
