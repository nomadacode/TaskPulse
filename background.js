chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ tasks: [] }, () => {
    console.log("TaskPulse PM initialized");
  });
  scheduleCheckIn();
});

function scheduleCheckIn() {
  chrome.alarms.create('dailyCheckIn', {
    when: getNextCheckInTime(),
    periodInMinutes: 24 * 60 // Repeat daily
  });
}

function getNextCheckInTime() {
  return new Promise((resolve) => {
    TaskManager.getSettings().then(settings => {
      const [hours, minutes] = settings.checkInTime.split(':').map(Number);
      const now = new Date();
      const checkInTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      if (checkInTime <= now) {
        checkInTime.setDate(checkInTime.getDate() + 1);
      }
      resolve(checkInTime.getTime());
    });
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyCheckIn') {
    performDailyCheckIn();
  }
});

async function performDailyCheckIn() {
  const settings = await TaskManager.getSettings();
  if (settings.notificationEnabled) {
    const dueTasks = await TaskManager.getDueTasks();
    if (dueTasks.length > 0) {
      chrome.notifications.create('dailyCheckIn', {
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: 'TaskPulse PM Daily Check-In',
        message: `You have ${dueTasks.length} tasks due today. Click to review.`,
        buttons: [{ title: 'Review Tasks' }]
      });
    }
  }
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'dailyCheckIn' && buttonIndex === 0) {
    chrome.tabs.create({ url: 'newtab/newtab.html' });
  }
});
