<#
    流萤动态博客：MySQL 数据库备份脚本（Windows Server）
    用法：powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
    参数：
      -BackupDir      备份输出目录，默认项目根目录下的 backups
      -KeepDays       备份保留天数，默认 14 天
      -MysqldumpPath  mysqldump.exe 路径或命令名，默认从 PATH 中查找
      -SkipCompress   不生成 zip 压缩包，保留原始 .sql 文件
    说明：备份文件默认压缩为 .sql.zip，压缩成功后删除中间 .sql 文件。
#>
[CmdletBinding()]
param(
    [string]$BackupDir = "",
    [int]$KeepDays = 14,
    [string]$MysqldumpPath = "mysqldump",
    [switch]$SkipCompress
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ProjectDir ".env"
if ([string]::IsNullOrWhiteSpace($BackupDir)) {
    $BackupDir = Join-Path $ProjectDir "backups"
}

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

$databaseUrl = Read-EnvValue "DATABASE_URL"
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw "未找到 DATABASE_URL，请检查 $EnvFile"
}

# 解析 mysql://user:password@host:port/database
$match = [regex]::Match($databaseUrl, "^mysql://([^:@/]+):([^@]*)@([^:/]+):([0-9]+)/([^?]+)")
if (-not $match.Success) {
    throw "无法解析 DATABASE_URL：$databaseUrl"
}
$dbUser = $match.Groups[1].Value
$dbPassword = $match.Groups[2].Value
$dbHost = $match.Groups[3].Value
$dbPort = $match.Groups[4].Value
$dbName = $match.Groups[5].Value

$dumpCommand = Get-Command $MysqldumpPath -ErrorAction SilentlyContinue
if (-not $dumpCommand) {
    throw "未找到 mysqldump，请安装 MySQL 客户端或用 -MysqldumpPath 指定路径"
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$sqlPath = Join-Path $BackupDir "$dbName-$timestamp.sql"

# 通过临时配置文件传递账号密码，避免密码出现在命令行参数中
$defaultsFile = Join-Path $env:TEMP "firefly-mysqldump-$timestamp.cnf"
$defaultsContent = @"
[client]
host=$dbHost
port=$dbPort
user=$dbUser
password=$dbPassword
"@
[System.IO.File]::WriteAllText($defaultsFile, $defaultsContent, (New-Object System.Text.UTF8Encoding($false)))

try {
    & $dumpCommand.Source "--defaults-extra-file=$defaultsFile" --single-transaction --routines --triggers --default-character-set=utf8mb4 "--result-file=$sqlPath" $dbName
    if ($LASTEXITCODE -ne 0) {
        throw "mysqldump 执行失败，退出码：$LASTEXITCODE"
    }
}
finally {
    Remove-Item -LiteralPath $defaultsFile -Force -ErrorAction SilentlyContinue
}

$resultPath = $sqlPath
if (-not $SkipCompress) {
    $zipPath = "$sqlPath.zip"
    Compress-Archive -LiteralPath $sqlPath -DestinationPath $zipPath -Force
    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $sqlPath -Force
        $resultPath = $zipPath
    }
}

Write-Output "备份完成：$resultPath"

# 清理超期备份（仅匹配当前库的备份文件）
$limit = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem -LiteralPath $BackupDir -File |
    Where-Object { $_.Name -like "$dbName-*.sql*" -and $_.LastWriteTime -lt $limit } |
    ForEach-Object {
        Write-Output "删除超期备份：$($_.Name)"
        Remove-Item -LiteralPath $_.FullName -Force
    }
Write-Output "已清理 $KeepDays 天前的历史备份"
