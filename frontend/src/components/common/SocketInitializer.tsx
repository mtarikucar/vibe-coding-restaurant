import { useEffect } from 'react';
import  useAuthStore  from '../../store/authStore';
import socketService from '../../services/socket';

const SocketInitializer = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect socket with user info
      socketService.connect(user.id, user.tenantId);
    }
  }, [isAuthenticated, user]);

  return null; // This component doesn't render anything
};

export default SocketInitializer;
