import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export function useNotifications(isRead?: boolean) {
  return useQuery({
    queryKey: ["/api/notifications", { isRead }],
    queryFn: async () => {
      const params = isRead !== undefined ? `?isRead=${isRead}` : '';
      const response = await fetch(`/api/notifications${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json() as Promise<Notification[]>;
    },
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count as number;
    },
    refetchInterval: 5000, // Ricarica ogni 5 secondi per aggiornamenti più frequenti
    staleTime: 1000, // Cache valida solo per 1 secondo
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onMutate: async (notificationId) => {
      // Aggiornamento ottimistico
      await queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
      await queryClient.cancelQueries({ queryKey: ["/api/notifications/unread-count"] });

      // Segna la notifica come letta nella cache
      queryClient.setQueryData(["/api/notifications"], (old: any) => {
        if (!old) return old;
        return old.map((notification: any) => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        );
      });

      // Aggiorna il conteggio (riduci di 1 solo se era non letta)
      queryClient.setQueryData(["/api/notifications/unread-count"], (old: number) => {
        const notifications = queryClient.getQueryData(["/api/notifications"]) as any[];
        const notification = notifications?.find((n: any) => n.id === notificationId);
        if (notification && !notification.isRead) {
          return Math.max(0, (old || 0) - 1);
        }
        return old || 0;
      });
    },
    onSuccess: () => {
      // Ricarica per sicurezza
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      // Ripristina in caso di errore
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      // Invalida le cache delle notifiche
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onMutate: async (notificationId) => {
      // Aggiornamento ottimistico - aggiorna subito la UI
      await queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
      await queryClient.cancelQueries({ queryKey: ["/api/notifications/unread-count"] });

      // Rimuovi la notifica dalla cache locale
      queryClient.setQueryData(["/api/notifications"], (old: any) => {
        if (!old) return old;
        return old.filter((notification: any) => notification.id !== notificationId);
      });

      // Aggiorna il conteggio
      queryClient.setQueryData(["/api/notifications/unread-count"], (old: number) => {
        return Math.max(0, (old || 0) - 1);
      });
    },
    onSuccess: () => {
      // Ricarica per essere sicuri che i dati siano allineati
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: (error, notificationId, context) => {
      // In caso di errore, ripristina i dati precedenti
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });
}