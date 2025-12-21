import React from 'react';

const Ionicons = ({ name, size, color, style }) => {
  const getIcon = () => {
    const icons = {
      'sunny': '☀️',
      'moon': '🌙',
      'exit-outline': '🚪',
      'shield-outline': '🛡️',
      'calendar-outline': '📅',
      'list-outline': '📋',
      'chevron-forward': '➡️',
      'calendar': '📅',
      'list': '📝',
      'shield': '🛡️',
      'arrow-forward': '→',
      'add-circle-outline': '➕',
      'time-outline': '⏰',
      'location-outline': '📍',
      'checkmark-done-outline': '✅',
      'pricetag-outline': '🏷️',
      'people-outline': '👥',
      'star-outline': '⭐',
      'notifications-outline': '🔔',
      'heart-outline': '❤️'
    };
    return icons[name] || '❓';
  };

  return (
    <span 
      style={{ 
        fontSize: size, 
        color: color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style 
      }}
    >
      {getIcon()}
    </span>
  );
};

export default Ionicons;