import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { showToast } from "../ui/toast";
import { useNotificationStore } from "../../store/notification.store";
import { notificationsService } from "../../services/notifications.service";
import { useAuthStore } from "../../store/auth.store";
import { showDeviceNotification } from "../../services/device-permissions.service";

export function NotificationListener() {
  const { isAuthenticated, user } = useAuthStore();
  const { notifications, addNotification } = useNotificationStore();
  const shouldListen = isAuthenticated && user?.role === "USER";
  const activeUserIdRef = useRef<string | null>(null);
  const hasLoadedInitialNotificationsRef = useRef(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsService.getAll(1, 50), // Fetch first 50 notifications
    refetchInterval: 30000, // Poll every 30 seconds
    enabled: shouldListen, // Admin accounts do not have user notifications.
    retry: false, // Don't retry on error
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (activeUserIdRef.current !== currentUserId) {
      activeUserIdRef.current = currentUserId;
      hasLoadedInitialNotificationsRef.current = false;
      seenNotificationIdsRef.current = new Set();
    }

    if (!shouldListen || !notificationsData?.data) {
      return;
    }

    const fetchedNotifications = notificationsData.data;

    // The first response is existing account data, not a batch of new events.
    // Store its IDs silently so it cannot cover the login/route transition.
    if (!hasLoadedInitialNotificationsRef.current) {
      seenNotificationIdsRef.current = new Set(
        fetchedNotifications.map((notification) => notification.id),
      );
      hasLoadedInitialNotificationsRef.current = true;
      return;
    }

    const existingIds = new Set([
      ...seenNotificationIdsRef.current,
      ...notifications.map((notification) => notification.id),
    ]);
    const newNotifications = fetchedNotifications.filter(
      (notification) => !existingIds.has(notification.id),
    );

    newNotifications.forEach((notification) => {
      seenNotificationIdsRef.current.add(notification.id);
      addNotification(notification);

      if (!notification.readAt) {
        showToast.info(notification.title, notification.message);
        void showDeviceNotification(notification.title, notification.message);
      }
    });
  }, [notificationsData, notifications, addNotification, shouldListen, user?.id]);

  return null; // This is a listener component, no UI
}
