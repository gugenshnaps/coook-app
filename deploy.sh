#!/bin/bash

echo "🚀 Starting automatic deployment..."

# Navigate to project directory
cd /Users/yuraokhapkin/Desktop/Caaafe

echo "📁 Changed to project directory"

# Add all changes
echo "📝 Adding all changes..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Translation: Full English translation - $(date)"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Deployment script completed!"
echo "🌐 Your site will be available at: https://gugenshnaps.github.io/cafe/"
echo "📱 Check GitHub Actions tab for deployment status"
