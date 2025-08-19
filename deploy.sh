#!/bin/bash

echo "🚀 Starting automatic deployment..."

# Переходим в папку проекта
cd /Users/yuraokhapkin/Desktop/Caaafe

echo "📁 Changed to project directory"

# Добавляем все изменения
echo "📝 Adding all changes..."
git add .

# Коммитим изменения
echo "💾 Committing changes..."
git commit -m "Rebrand: Change name from Caaafe to Coook - $(date)"

# Пушим в GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Deployment script completed!"
echo "🌐 Your site will be available at: https://gugenshnaps.github.io/cafe/"
echo "📱 Check GitHub Actions tab for deployment status"
