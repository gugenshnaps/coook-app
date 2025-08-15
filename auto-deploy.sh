#!/bin/bash

echo "🔄 Setting up automatic deployment..."

# Переходим в папку проекта
cd /Users/yuraokhapkin/Desktop/Caaafe

echo "📁 Changed to project directory: $(pwd)"

# Функция для автоматического деплоя
auto_deploy() {
    echo "🚀 Auto-deploying changes..."
    
    # Добавляем все изменения
    git add .
    
    # Коммитим с временной меткой
    git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Пушим в GitHub
    git push origin main
    
    echo "✅ Auto-deployment completed at $(date)"
    echo "🌐 Site will update at: https://gugenshnaps.github.io/cafe/"
}

# Функция для мониторинга файлов
watch_files() {
    echo "👀 Watching for file changes..."
    echo "Press Ctrl+C to stop watching"
    
    # Используем fswatch для мониторинга (если установлен)
    if command -v fswatch &> /dev/null; then
        fswatch -o . | while read f; do
            echo "📝 File change detected at $(date)"
            auto_deploy
        done
    else
        echo "⚠️  fswatch not found. Install it with: brew install fswatch"
        echo "📋 Manual deployment: run './deploy.sh' after making changes"
    fi
}

# Основное меню
echo "Choose deployment mode:"
echo "1) Auto-watch mode (continuous monitoring)"
echo "2) Manual mode (deploy once)"
echo "3) Check file differences with GitHub"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        watch_files
        ;;
    2)
        auto_deploy
        ;;
    3)
        echo "🔍 Checking file differences with GitHub..."
        git fetch origin
        git diff origin/main
        ;;
    *)
        echo "Invalid choice. Running manual deployment..."
        auto_deploy
        ;;
esac
