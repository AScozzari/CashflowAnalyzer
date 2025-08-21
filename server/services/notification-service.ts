import { storage } from '../storage';
import type { InsertNotification, Notification } from '@shared/schema';

export interface CommunicationNotification {
  userId: string;
  type: 'new_whatsapp' | 'new_sms' | 'new_email' | 'new_messenger';
  category: 'whatsapp' | 'sms' | 'email' | 'messenger';
  from: string;
  to?: string;
  originalContent: string;
  channelProvider: 'twilio' | 'linkmobility' | 'skebby' | 'sendgrid' | 'facebook';
  messageId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Create communication notification
  async createCommunicationNotification(data: CommunicationNotification): Promise<void> {
    try {
      // Generate title and message based on channel
      const { title, message, actionUrl } = this.generateNotificationContent(data);
      
      const notification: InsertNotification = {
        userId: data.userId,
        messageId: data.messageId || crypto.randomUUID(),
        type: data.type,
        category: data.category,
        title,
        message,
        from: data.from,
        to: data.to,
        channelProvider: data.channelProvider,
        originalContent: data.originalContent.substring(0, 500), // Limit content length
        actionUrl,
        priority: data.priority || 'normal',
        isRead: false
      };

      await storage.createNotification(notification);
      
      console.log(`📬 Notification created: ${data.category} from ${data.from}`);
    } catch (error) {
      console.error('Error creating communication notification:', error);
    }
  }

  // Generate notification content based on channel
  private generateNotificationContent(data: CommunicationNotification): {
    title: string;
    message: string;
    actionUrl: string;
  } {
    const shortFrom = data.from.length > 20 ? data.from.substring(0, 17) + '...' : data.from;
    const shortContent = data.originalContent.length > 60 
      ? data.originalContent.substring(0, 57) + '...' 
      : data.originalContent;

    switch (data.category) {
      case 'whatsapp':
        return {
          title: `💬 Nuovo messaggio WhatsApp`,
          message: `Da ${shortFrom}: "${shortContent}"`,
          actionUrl: `/communications/whatsapp?messageId=${data.messageId}`
        };
      
      case 'sms':
        return {
          title: `📱 Nuovo SMS ricevuto`,
          message: `Da ${shortFrom}: "${shortContent}"`,
          actionUrl: `/communications/sms?messageId=${data.messageId}`
        };
      
      case 'email':
        return {
          title: `✉️ Nuova email ricevuta`,
          message: `Da ${shortFrom}: "${shortContent}"`,
          actionUrl: `/communications/email?messageId=${data.messageId}`
        };
      
      case 'messenger':
        return {
          title: `👤 Nuovo messaggio Messenger`,
          message: `Da ${shortFrom}: "${shortContent}"`,
          actionUrl: `/communications/messenger?messageId=${data.messageId}`
        };
      
      default:
        return {
          title: `📨 Nuovo messaggio`,
          message: `Da ${shortFrom}: "${shortContent}"`,
          actionUrl: `/communications`
        };
    }
  }

  // Create movement notification (existing functionality)
  async createMovementNotification(
    userId: string,
    movementId: string,
    type: 'new_movement' | 'movement_updated' | 'movement_assigned',
    title: string,
    message: string
  ): Promise<void> {
    try {
      const notification: InsertNotification = {
        userId,
        movementId,
        type,
        category: 'movement',
        title,
        message,
        actionUrl: `/movements/${movementId}`,
        priority: 'normal',
        isRead: false
      };

      await storage.createNotification(notification);
    } catch (error) {
      console.error('Error creating movement notification:', error);
    }
  }

  // Get all notifications for user with categorization
  async getUserNotifications(userId: string): Promise<{
    unreadCount: number;
    categories: {
      movement: Notification[];
      whatsapp: Notification[];
      sms: Notification[];
      email: Notification[];
      messenger: Notification[];
    };
    recent: Notification[];
  }> {
    try {
      const notifications = await storage.getNotifications(userId);
      
      // Categorize notifications
      const categories = {
        movement: notifications.filter((n: Notification) => n.category === 'movement'),
        whatsapp: notifications.filter((n: Notification) => n.category === 'whatsapp'),
        sms: notifications.filter((n: Notification) => n.category === 'sms'),
        email: notifications.filter((n: Notification) => n.category === 'email'),
        messenger: notifications.filter((n: Notification) => n.category === 'messenger')
      };

      // Get recent unread notifications (last 10)
      const recent = notifications
        .filter((n: Notification) => !n.isRead)
        .sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

      return {
        unreadCount,
        categories,
        recent
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return {
        unreadCount: 0,
        categories: {
          movement: [],
          whatsapp: [],
          sms: [],
          email: [],
          messenger: []
        },
        recent: []
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await storage.markNotificationAsRead(notificationId);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await storage.markAllNotificationsAsRead(userId);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Auto-assign users to notifications based on business rules
  async determineNotificationRecipients(data: CommunicationNotification): Promise<string[]> {
    try {
      // Get all admin and finance users for communication notifications
      const users = await storage.getUsers();
      
      return users
        .filter(user => ['admin', 'finance'].includes(user.role))
        .map(user => user.id);
    } catch (error) {
      console.error('Error determining notification recipients:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();