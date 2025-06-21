import React from 'react';

interface SkeletonProps {
 variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table' | 'list';
 width?: string | number;
 height?: string | number;
 className?: string;
 count?: number;
 animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
 variant = 'text',
 width,
 height,
 className = '',
 count = 1,
 animation = 'pulse'
}) => {
 // Base animation class
 const animationClass = animation === 'pulse' 
  ? 'animate-pulse' 
  : animation === 'wave' 
   ? 'animate-shimmer' 
   : '';

 // Base skeleton class
 const baseClass = 'bg-gray-200 rounded';

 // Style object for width and height
 const style: React.CSSProperties = {};
 if (width) style.width = typeof width === 'number' ? `${width}px` : width;
 if (height) style.height = typeof height === 'number' ? `${height}px` : height;

 // Variant specific classes
 const variantClass = () => {
  switch (variant) {
   case 'text':
    return 'h-4 rounded';
   case 'circular':
    return 'rounded-full';
   case 'rectangular':
    return 'rounded-md';
   case 'card':
    return 'rounded-lg';
   case 'table':
    return 'rounded-md';
   case 'list':
    return 'rounded-md';
   default:
    return '';
  }
 };

 // Render skeleton items based on count
 const renderSkeletons = () => {
  const skeletons = [];
  for (let i = 0; i < count; i++) {
   skeletons.push(
    <div
     key={i}
     className={`${baseClass} ${variantClass()} ${animationClass} ${className}`}
     style={style}
    />
   );
  }
  return skeletons;
 };

 // Render different variants
 const renderVariant = () => {
  switch (variant) {
   case 'card':
    return (
     <div className={`${baseClass} ${variantClass()} ${animationClass} p-4 ${className}`} style={style}>
      <div className="h-24 bg-gray-300 rounded-md mb-4"></div>
      <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
     </div>
    );
   case 'table':
    return (
     <div className={`${baseClass} ${variantClass()} ${animationClass} overflow-hidden ${className}`} style={style}>
      <div className="h-8 bg-gray-300 mb-2"></div>
      {[...Array(5)].map((_, i) => (
       <div key={i} className="h-6 bg-gray-300 mb-2"></div>
      ))}
     </div>
    );
   case 'list':
    return (
     <div className={`${baseClass} ${variantClass()} ${animationClass} ${className}`} style={style}>
      {[...Array(count)].map((_, i) => (
       <div key={i} className="flex items-center p-2 mb-2">
        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
        <div className="flex-1">
         <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
         <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
       </div>
      ))}
     </div>
    );
   default:
    return renderSkeletons();
  }
 };

 return renderVariant();
};

export default Skeleton;
