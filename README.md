# 📱 Meeting Notifications Desktop App

A cross-platform desktop application for receiving meeting notifications and push notifications directly on your desktop.

## ✨ Features

- 🔔 Real-time push notifications for meetings
- 🖥️ System tray integration
- 📅 Meeting conflict detection
- 🌐 Connects to live Azure backend service
- 💻 Cross-platform (Windows, macOS, Linux)

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- Internet connection

### Installation

1. **Download or Clone**
   ```bash
   # Option 1: Download ZIP and extract
   # OR
   # Option 2: Clone repository
   git clone https://github.com/your-username/meeting-notifications.git
   cd meeting-notifications
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the App**
   ```bash
   npm start
   ```

That's it! The app will automatically connect to the live backend service.

## 🎯 How to Use

1. **Launch** the app using `npm start`
2. **Subscribe** to notifications through the web interface
3. **Receive** meeting notifications directly on your desktop
4. **Manage** conflicts through the system tray

## 🔧 Development

### Available Scripts

- `npm start` - Run the app in development mode
- `npm run dev` - Run with detailed logging
- `npm run build` - Build the app for distribution

### Backend Service

This app connects to a live backend service hosted on Azure:
- **API**: https://app-push-notif-prod-b3vufhiqicj7a.azurewebsites.net/
- **Web Interface**: https://app-push-notif-prod-b3vufhiqicj7a.azurewebsites.net/frontend.html

## 📁 Project Structure

```
meeting-notifications/
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── package.json         # Dependencies and scripts
├── assets/              # App icons and images
│   ├── icon.ico
│   ├── icon.png
│   └── tray-icon.png
└── README.md           # This file
```

## 🛠️ Built With

- [Electron](https://electronjs.org/) - Desktop app framework
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Azure App Service](https://azure.microsoft.com/) - Backend hosting

## 📋 Requirements

- **Node.js**: 16.x or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **Memory**: 100MB+ available RAM
- **Storage**: 50MB+ available disk space

## 🤝 Support

If you encounter any issues:

1. Check that Node.js is properly installed
2. Ensure internet connection is active
3. Try running `npm install` again
4. Restart the application

## 📄 License

MIT License - feel free to use and modify as needed.

---

**Live Backend**: https://app-push-notif-prod-b3vufhiqicj7a.azurewebsites.net/  
**Web Version**: https://app-push-notif-prod-b3vufhiqicj7a.azurewebsites.net/frontend.html
