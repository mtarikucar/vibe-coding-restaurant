import { useEffect } from"react";
import useAuthStore from"../../store/authStore";
import socketService from"../../services/socket";

const SocketInitializer = () => {
 const { user, isAuthenticated } = useAuthStore();

 useEffect(() => {
  // Connect or disconnect socket based on authentication status
  if (isAuthenticated && user) {
   // Connect socket with user info
   socketService.connect(user.id, user.tenantId);
  } else {
   // Disconnect socket when user logs out
   socketService.disconnect();
  }

  // Cleanup on component unmount
  return () => {
   // No need to disconnect on unmount as the socket should stay connected
   // throughout the app's lifecycle, but we'll clean up event listeners
   // This is handled internally by the socket service
  };
 }, [isAuthenticated, user]);

 // Add a window event listener to handle page visibility changes
 useEffect(() => {
  const handleVisibilityChange = () => {
   if (document.visibilityState ==="visible" && isAuthenticated && user) {
    // Reconnect socket when page becomes visible again
    if (!socketService.isConnected()) {
     socketService.connect(user.id, user.tenantId);
    }
   }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
   document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
 }, [isAuthenticated, user]);

 return null; // This component doesn't render anything
};

export default SocketInitializer;
