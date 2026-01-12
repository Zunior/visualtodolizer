import React from 'react';
import * as LucideIcons from 'lucide-react-native';

interface LucideIconProps {
  iconName?: string;
  size?: number;
  color?: string;
}

// Type-safe icon component that dynamically loads Lucide icons
export default function LucideIcon({
  iconName = 'circle',
  size = 40,
  color = '#3b82f6',
}: LucideIconProps) {
  // Convert kebab-case to PascalCase for component name
  // Handle special cases like "check-circle-2" -> "CheckCircle2"
  const iconComponentName = iconName
    .split('-')
    .map((word, index) => {
      // First word: capitalize first letter
      // Subsequent words: capitalize first letter
      // Numbers stay as-is
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');

  // Get the icon component from lucide-react-native
  // @ts-ignore - Dynamic component access
  const IconComponent = LucideIcons[iconComponentName] as React.ComponentType<{
    size?: number;
    color?: string;
  }>;

  // Fallback to Circle icon if icon not found
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" (${iconComponentName}) not found in lucide-react-native, using Circle as fallback`);
    const FallbackIcon = LucideIcons.Circle;
    return <FallbackIcon size={size} color={color} />;
  }

  return <IconComponent size={size} color={color} />;
}
