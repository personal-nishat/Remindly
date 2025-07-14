import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            preload: join(__dirname, 'preload.js')
        },
        show: false
    });

    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        console.log('Permission requested:', permission);
        if (permission === 'notifications') {
            callback(true);
        } else {
            callback(false);
        }
    });

    // Determine the server URL based on environment
    const isDev = process.env.NODE_ENV === 'development';
    const serverUrl = isDev ? 'http://localhost:5041' : 'https://app-push-notif-prod-b3vufhiqicj7a.azurewebsites.net';
    
    mainWindow.loadURL(`${serverUrl}/frontend.html`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Developer tools can be opened manually with Ctrl+Shift+I or F12
        
        if (process.platform === 'darwin') {
            mainWindow.show();
        } else {
            mainWindow.focus();
        }
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            
            if (Notification.isSupported()) {
                new Notification({
                    title: 'Meeting Reminders',
                    body: 'App minimized to tray. Notifications will continue working.',
                    icon: join(__dirname, 'assets', 'icon.png')
                }).show();
            }
        }
    });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levelName = ['verbose', 'info', 'warning', 'error'][level];
        console.log(`[Electron-Web-${levelName}]:`, message);
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            mainWindow.webContents.toggleDevTools();
        }
        if (input.key === 'F12') {
            mainWindow.webContents.toggleDevTools();
        }
    });
}

function createTray() {
    const iconPath = join(__dirname, 'assets', 'tray-icon.png');
    let trayIcon = nativeImage.createFromPath(iconPath);
    
    if (trayIcon.isEmpty()) {
        trayIcon = nativeImage.createEmpty();
    }
    
    tray = new Tray(trayIcon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
                if (process.platform === 'darwin') {
                    app.dock.show();
                }
            }
        },
        {
            label: 'Toggle Developer Tools',
            click: () => {
                mainWindow.webContents.toggleDevTools();
            }
        },
        {
            label: 'Test Desktop Notification',
            click: () => {
                if (Notification.isSupported()) {
                    new Notification({
                        title: ' Desktop Test',
                        body: 'This is a direct desktop notification from Electron!',
                        icon: join(__dirname, 'assets', 'icon.png')
                    }).show();
                }
            }
        },
        {
            label: 'Test Interactive Conflict Notification',
            click: () => {
                showInteractiveConflictNotification(
                    'test-conflict-123',
                    'MEETING-A',
                    'MEETING-B',
                    'Test User'
                );
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Meeting Reminders - Desktop App');
    
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

function showInteractiveConflictNotification(conflictId, meeting1Id, meeting2Id, userDisplayName) {
    console.log(` Showing interactive conflict notification for ${conflictId}`);
    
    try {
        const notification = new Notification({
            title: ' MEETING CONFLICT DETECTED',
            body: `You have conflicting meetings: ${meeting1Id} and ${meeting2Id}. Click to choose which meeting to attend.`,
            icon: join(__dirname, 'assets', 'icon.png'),
            urgency: 'critical',
            timeoutType: 'never', 
            actions: [
                {
                    type: 'button',
                    text: `Attend ${meeting1Id}`
                },
                {
                    type: 'button',
                    text: `Attend ${meeting2Id}`
                }
            ]
        });

        notification.on('click', () => {
            console.log(' Conflict notification clicked - opening choice dialog');
            
            mainWindow.webContents.send('show-conflict-choice', {
                conflictId: conflictId,
                meeting1Id: meeting1Id,
                meeting2Id: meeting2Id
            });
            
            mainWindow.show();
            mainWindow.focus();
        });

        notification.on('action', (event, index) => {
            console.log(` Action button clicked: ${index}`);
            
            const selectedMeetingId = index === 0 ? meeting1Id : meeting2Id;
            console.log(` User selected meeting: ${selectedMeetingId} for conflict: ${conflictId}`);
            
            resolveConflictChoice(conflictId, selectedMeetingId);
            
            showConfirmationNotification(selectedMeetingId, conflictId);
        });

        notification.on('close', () => {
            console.log('Conflict notification closed');
        });

        notification.show();
        
    } catch (error) {
        console.error(' Error showing notification:', error);
        showFallbackConflictDialog(conflictId, meeting1Id, meeting2Id);
    }
}

function showFallbackConflictDialog(conflictId, meeting1Id, meeting2Id) {
    console.log(' Showing fallback conflict dialog in main window');
    
    mainWindow.webContents.send('show-conflict-choice', {
        conflictId: conflictId,
        meeting1Id: meeting1Id,
        meeting2Id: meeting2Id
    });
    
    mainWindow.show();
    mainWindow.focus();
}

async function resolveConflictChoice(conflictId, selectedMeetingId) {
    try {
        const appInstanceId = await getStoredAppInstanceId();
        
        const requestBody = {
            conflictId: conflictId,
            selectedMeetingId: selectedMeetingId,
            appInstanceId: appInstanceId
        };
        const response = await fetch(`${serverUrl}/api/MeetingChoice/resolve-conflict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const result = await response.json();
        } else {
            const errorText = await response.text();
            console.error('Failed to resolve conflict:', response.status, errorText);
        }
    } catch (error) {
        console.error('Error resolving conflict:', error);
    }
}

async function getStoredAppInstanceId() {
    try {
        const appInstanceId = await mainWindow.webContents.executeJavaScript('localStorage.getItem("appInstanceId")');
        if (appInstanceId) {
            return appInstanceId;
        }
    } catch (error) {
        console.error('Error getting stored app instance ID:', error);
    }
    
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function showConfirmationNotification(selectedMeetingId, conflictId) {
    const confirmation = new Notification({
        title: ' Meeting Choice Confirmed',
        body: `You chose ${selectedMeetingId}. You'll receive reminders only for this meeting.`,
        icon: join(__dirname, 'assets', 'icon.png')
    });

    confirmation.show();
}

ipcMain.handle('show-conflict-notification', (event, data) => {
    console.log(' Received conflict notification request:', data);
    
    showInteractiveConflictNotification(
        data.conflictId,
        data.meeting1Id,
        data.meeting2Id,
        data.userDisplayName
    );
});

ipcMain.handle('resolve-conflict-choice', async (event, data) => {
    console.log(' Received conflict choice resolution:', data);
    
    await resolveConflictChoice(data.conflictId, data.selectedMeetingId);
    
    return { success: true, message: 'Conflict resolved successfully' };
});

ipcMain.handle('show-native-notification', (event, data) => {
    console.log(' Showing native notification:', data);
    
    const notification = new Notification({
        title: data.title || 'Notification',
        body: data.body || '',
        icon: join(__dirname, 'assets', 'icon.png'),
        urgency: data.urgency || 'normal'
    });

    notification.show();
    
    return { success: true };
});

app.whenReady().then(() => {
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.meetingreminders.app');
    }

    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            mainWindow.show();
        }
    });
}