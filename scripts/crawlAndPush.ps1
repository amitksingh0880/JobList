# PowerShell script to run job crawler and push updates to GitHub
$ErrorActionPreference = "Stop"

# Navigate to project directory
Set-Location -Path "d:\Project-26\JobListing"

Write-Output "Running job crawler..."
node scripts/crawlJobs.js

# Stage the output data files
git add data/jobs.json data/jobs.ts

# Check if there are changes to commit
$status = git status --porcelain data/jobs.json data/jobs.ts

if ($status) {
    Write-Output "Changes detected. Committing and pushing updates..."
    git commit -m "chore: auto-update crawled job listings"
    git push origin master
    Write-Output "Updates pushed successfully!"
} else {
    Write-Output "No new jobs found. Database is up-to-date."
}
