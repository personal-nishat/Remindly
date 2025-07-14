const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Conflict notification methods
    showConflictNotification: (data) => ipcRenderer.invoke('show-conflict-notification', data),
    resolveConflictChoice: (data) => ipcRenderer.invoke('resolve-conflict-choice', data),
    showNativeNotification: (data) => ipcRenderer.invoke('show-native-notification', data),
    
    // Listen for conflict choice dialogs
    onShowConflictChoice: (callback) => ipcRenderer.on('show-conflict-choice', callback),
    removeConflictChoiceListener: (callback) => ipcRenderer.removeListener('show-conflict-choice', callback),
    
    // Platform detection
    platform: process.platform,
    isWindows: process.platform === 'win32',
    isElectron: true
});