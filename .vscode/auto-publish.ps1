$ErrorActionPreference = 'Stop'

$gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
if ($gitCommand) {
    $git = $gitCommand.Source
} elseif (Test-Path 'C:\Program Files\Git\cmd\git.exe') {
    $git = 'C:\Program Files\Git\cmd\git.exe'
} else {
    Write-Error 'Git was not found. Install Git for Windows to enable auto-publishing.'
    exit 1
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repositoryRoot

$branch = & $git branch --show-current
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Could not determine the current Git branch.'
    exit 1
}
if ($branch -ne 'main') {
    Write-Error "Auto-publishing requires the main branch; current branch is '$branch'."
    exit 1
}

$upstream = & $git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
if ($LASTEXITCODE -ne 0 -or -not $upstream) {
    Write-Error 'The main branch has no upstream. Set origin/main as its upstream before using auto-publish.'
    exit 1
}

$watcher = [System.IO.FileSystemWatcher]::new($repositoryRoot)
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor
    [System.IO.NotifyFilters]::FileName -bor
    [System.IO.NotifyFilters]::DirectoryName -bor
    [System.IO.NotifyFilters]::CreationTime
$watcher.InternalBufferSize = 32768
$watcher.EnableRaisingEvents = $true

Write-Output "Auto-publish watcher started for $repositoryRoot. Save a file to publish; stop this task to pause."

try {
    while ($true) {
        $change = $watcher.WaitForChanged([System.IO.WatcherChangeTypes]::All, -1)
        if ($change.TimedOut -or $change.Name -match '(^|[\\/])\.git([\\/]|$)') {
            continue
        }

        do {
            $change = $watcher.WaitForChanged([System.IO.WatcherChangeTypes]::All, 1500)
        } while (-not $change.TimedOut)

        $status = & $git status --porcelain --untracked-files=all
        if ($LASTEXITCODE -ne 0) {
            Write-Output 'AUTO-PUBLISH ERROR: Could not inspect repository changes; auto-publish will retry after the next save.'
            continue
        }
        if (-not $status) {
            continue
        }

        & $git add --all
        if ($LASTEXITCODE -ne 0) {
            Write-Output 'AUTO-PUBLISH ERROR: Git could not stage the changes; auto-publish will retry after the next save.'
            continue
        }

        & $git diff --cached --quiet --exit-code
        if ($LASTEXITCODE -eq 0) {
            continue
        }
        if ($LASTEXITCODE -ne 1) {
            Write-Output 'AUTO-PUBLISH ERROR: Git could not compare staged changes; auto-publish will retry after the next save.'
            continue
        }

        $commitMessage = 'Auto-publish: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
        & $git commit -m $commitMessage -m 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>'
        if ($LASTEXITCODE -ne 0) {
            Write-Output 'AUTO-PUBLISH ERROR: Git could not create the auto-publish commit. Check the task output and resolve the issue.'
            continue
        }

        & $git push origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Output 'AUTO-PUBLISH ERROR: Push failed. The commit remains local; authenticate with GitHub and save a file again to retry.'
            continue
        }

        Write-Output 'Auto-publish successful. GitHub Pages will deploy the update shortly.'
    }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Write-Output 'Auto-publish watcher stopped.'
}
