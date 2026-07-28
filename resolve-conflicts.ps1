# PowerShell script to resolve all git merge conflicts
# Run from: d:\projects\supportai\customer-aibased-support
# Strategy: Keep OUR (HEAD) version for registration files we wrote,
#           keep THEIRS (incoming) for all others

Set-Location "d:\projects\supportai\customer-aibased-support"

Write-Host "=== Resolving Git Merge Conflicts ===" -ForegroundColor Cyan

# ─── Step 1: Keep OUR version for files we authored (registration system) ───
Write-Host "`n[1/3] Keeping OUR version for registration-system files..." -ForegroundColor Yellow

$ourFiles = @(
    "server/modules/user/user.schema.js",
    "server/modules/auth/auth.service.js",
    "server/modules/auth/auth.route.js",
    "server/modules/user/otp.service.js",
    "server/validation/auth.validation.js",
    "server/validation/index.js",
    "client/frontend/src/api/auth.api.js",
    "client/frontend/src/routes/PublicRoutes.tsx",
    "client/frontend/src/routes/AdminRoutes.tsx",
    "client/frontend/src/layout/AdminLayout.tsx"
)

foreach ($file in $ourFiles) {
    if (Test-Path $file) {
        git checkout --ours -- $file
        git add $file
        Write-Host "  [OURS] $file" -ForegroundColor Green
    }
}

# ─── Step 2: Keep THEIRS version for all other conflicted files ───
Write-Host "`n[2/3] Keeping THEIRS version for all other conflicted files..." -ForegroundColor Yellow

$conflicts = git diff --name-only --diff-filter=U 2>$null
if ($conflicts) {
    foreach ($file in $conflicts) {
        git checkout --theirs -- $file
        git add $file
        Write-Host "  [THEIRS] $file" -ForegroundColor Blue
    }
} else {
    Write-Host "  No remaining conflicts found." -ForegroundColor Gray
}

# ─── Step 3: Verify no conflict markers remain ───
Write-Host "`n[3/3] Checking for remaining conflict markers..." -ForegroundColor Yellow

$remaining = git diff --name-only --diff-filter=U 2>$null
if ($remaining) {
    Write-Host "  WARNING: Still conflicted: $remaining" -ForegroundColor Red
} else {
    Write-Host "  All conflicts resolved!" -ForegroundColor Green
}

Write-Host "`n=== Done! ===" -ForegroundColor Cyan
Write-Host "Now commit: git commit -m 'resolve: merge conflicts - keep registration system changes'" -ForegroundColor White
