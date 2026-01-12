import { Platform } from 'react-native';

// Sci-fi theme inspired by Arwes framework
export const SciFiTheme = {
  colors: {
    // Dark backgrounds
    bgPrimary: '#0a0e27', // Deep space blue
    bgSecondary: '#0f1629', // Slightly lighter
    bgTertiary: '#151b2e', // Even lighter
    
    // Neon accents
    neonCyan: '#00f0ff',
    neonGreen: '#00ff88',
    neonBlue: '#0080ff',
    neonPurple: '#b026ff',
    
    // Text colors
    textPrimary: '#e0e0e0',
    textSecondary: '#a0a0a0',
    textAccent: '#00f0ff',
    
    // Borders and glows
    borderPrimary: '#00f0ff',
    borderSecondary: '#0080ff',
    borderDim: 'rgba(0, 240, 255, 0.3)',
    
    // Overlays
    overlay: 'rgba(10, 14, 39, 0.9)',
    overlayLight: 'rgba(10, 14, 39, 0.7)',
  },
  
  effects: {
    glow: Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(0, 240, 255, 0.8)',
      },
      default: {
        shadowColor: '#00f0ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
    glowStrong: Platform.select({
      web: {
        boxShadow: '0 0 12px rgba(0, 240, 255, 1)',
      },
      default: {
        shadowColor: '#00f0ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 12,
      },
    }),
  },
  
  borders: {
    default: {
      borderWidth: 1,
      borderColor: '#00f0ff',
      borderStyle: 'solid',
    },
    thick: {
      borderWidth: 2,
      borderColor: '#00f0ff',
      borderStyle: 'solid',
    },
    dim: {
      borderWidth: 1,
      borderColor: 'rgba(0, 240, 255, 0.3)',
      borderStyle: 'solid',
    },
  },
};
