import { useEffect, useState } from 'react';
import { 
  SignalIcon, 
  SignalSlashIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import socketService from '../../services/socket';

interface SocketStatusProps {
  showLabel?: boolean;
  className?: string;
}

const SocketStatus: React.FC<SocketStatusProps> = ({ 
  showLabel = false,
  className = ''
}) => {
  const [status, setStatus] = useState<string>(socketService.getStatus());

  useEffect(() => {
    // Subscribe to socket status changes
    const unsubscribe = socketService.onStatusChange(setStatus);
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Determine icon and color based on status
  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <SignalIcon className="h-5 w-5 text-green-500" />,
          label: 'Connected',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'connecting':
        return {
          icon: <SignalIcon className="h-5 w-5 text-yellow-500 animate-pulse" />,
          label: 'Connecting',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      case 'error':
        return {
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
          label: 'Connection Error',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
      case 'disconnected':
      default:
        return {
          icon: <SignalSlashIcon className="h-5 w-5 text-gray-500" />,
          label: 'Disconnected',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };

  const { icon, label, bgColor, textColor } = getStatusDisplay();

  return (
    <div className={`flex items-center ${bgColor} rounded-full px-2 py-1 ${className}`}>
      {icon}
      {showLabel && (
        <span className={`ml-1 text-xs font-medium ${textColor}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default SocketStatus;
