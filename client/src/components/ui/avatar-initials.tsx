import React from 'react';

interface AvatarInitialsProps {
  name: string;
  className?: string;
}

export function AvatarInitials({ name, className = "" }: AvatarInitialsProps) {
  const getInitials = (fullName: string) => {
    if (!fullName) return "?";
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <span className={className}>
      {getInitials(name)}
    </span>
  );
}