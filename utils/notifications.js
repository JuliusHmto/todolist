import * as Notifications from 'expo-notifications';

export const initNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('You need to enable notifications to receive task reminders');
    return false;
  }
  
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  return true;
};

export const scheduleTaskNotification = async (taskId, title, dueDate) => {
  const trigger = new Date(dueDate);
  trigger.setHours(9);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Created',
      body: `New task "${title}" has been created`,
      data: { taskId },
    },
    trigger: { seconds: 2 },
  });


  return await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: `Task "${title}" is due today!`,
      data: { taskId },
    },
    trigger,
  });
};

export const cancelTaskNotification = async (notificationId) => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}; 