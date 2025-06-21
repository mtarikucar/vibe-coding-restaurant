import React from 'react';

interface LoadingSpinnerProps {
 size?: 'sm' | 'md' | 'lg' | 'xl';
 color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
 fullScreen?: boolean;
 text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
 size = 'md',
 color = 'primary',
 fullScreen = false,
 text
}) => {
 // Size mapping
 const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4'
 };

 // Color mapping
 const colorMap = {
  primary: 'border-blue-500',
  secondary: 'border-gray-500',
  success: 'border-green-500',
  danger: 'border-red-500',
  warning: 'border-yellow-500',
  info: 'border-cyan-500',
  light: 'border-gray-200',
  'border-gray-800'
 };

 const spinnerClasses = `
  inline-block rounded-full 
  ${sizeMap[size]} 
  border-solid border-t-transparent 
  ${colorMap[color]} 
  animate-spin
 `;

 if (fullScreen) {
  return (
   <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <div className="text-center">
     <div className={spinnerClasses}></div>
     {text && <p className="mt-4 text-gray-700">{text}</p>}
    </div>
   </div>
  );
 }

 return (
  <div className="flex items-center justify-center">
   <div className="text-center">
    <div className={spinnerClasses}></div>
    {text && <p className="mt-2 text-gray-700 text-sm">{text}</p>}
   </div>
  </div>
 );
};

export default LoadingSpinner;
