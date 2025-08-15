# Coook - Telegram Mini App Cafe

A Telegram Mini App for finding cafes in Brazilian cities.

## 🌟 Features

- **City Selection**: Choose from available cities (São Paulo, Rio de Janeiro, Brasília, and more)
- **Cafe Discovery**: Browse cafes with beautiful cards showing images, names, and descriptions
- **Detailed Views**: Click on cafes to see full details, working hours, and more photos
- **Admin Panel**: Manage cafes and cities through a separate admin interface
- **Real-time Sync**: Changes in admin panel automatically sync with the main app
- **Mobile Optimized**: Designed specifically for mobile devices with touch gestures

## 🚀 Quick Start

### Option 1: Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `node server.js`
4. Open http://localhost:7000 in your browser

### Option 2: GitHub Pages
The app is automatically deployed to GitHub Pages and available at:
https://gugenshnaps.github.io/coook-app/

## 📱 App Structure

- **Main App** (`/`): User-facing cafe discovery interface
- **Admin Panel** (`/admin`): Management interface for cafes and cities
- **Telegram Version** (`/telegram`): Telegram WebApp optimized version

## 🛠️ Admin Panel Features

### Cafe Management
- Add new cafes with images, descriptions, and working hours
- Edit existing cafe information
- Delete cafes
- Filter cafes by city and search terms

### City Management
- Add new cities to expand the app's coverage
- Remove cities (only if they have no cafes)
- Automatic synchronization with the main app

## 🔧 Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express
- **Storage**: localStorage for client-side data persistence
- **Deployment**: GitHub Actions for automatic deployment
- **Hosting**: GitHub Pages

## 📁 File Structure

```
coook-app/
├── index.html          # Main application
├── styles.css          # Main app styles
├── script.js           # Main app logic
├── admin.html          # Admin panel
├── admin.css           # Admin panel styles
├── admin.js            # Admin panel logic
├── telegram.html       # Telegram WebApp version
├── telegram-styles.css # Telegram-specific styles
├── telegram-app.js     # Telegram app logic
├── telegram-config.js  # Telegram API configuration
├── server.js           # Node.js server
├── README.md           # This file
└── .github/workflows/  # GitHub Actions deployment
    └── deploy.yml
```

## 🌐 Deployment

The app automatically deploys to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment
1. Make your changes
2. Commit: `git commit -m "Your message"`
3. Push: `git push origin main`
4. GitHub Actions will automatically deploy to GitHub Pages

## 📱 Telegram WebApp Integration

The app includes a Telegram-optimized version with:
- Telegram WebApp API integration
- Mobile-first design
- Touch gestures and haptic feedback
- Theme-aware styling

## 🔒 Security

- Admin panel is not publicly accessible
- Data is stored locally in the user's browser
- No sensitive information is transmitted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For questions or issues, please open an issue on GitHub.

---

**Last updated**: August 2024
**Version**: 1.0.0
