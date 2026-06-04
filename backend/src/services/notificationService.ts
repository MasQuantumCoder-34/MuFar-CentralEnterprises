import Notification from '../models/Notification';
import { NotificationType } from '@mufar-commerce/shared';

const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  referenceId?: string,
  referenceModel?: string
): Promise<void> => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      referenceId,
      referenceModel,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export { createNotification };
