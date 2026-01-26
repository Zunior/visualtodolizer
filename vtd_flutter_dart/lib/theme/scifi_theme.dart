import 'package:flutter/material.dart';

// Sci-fi theme inspired by Arwes framework
class SciFiTheme {
  // Dark backgrounds
  static const Color bgPrimary = Color(0xFF0a0e27); // Deep space blue
  static const Color bgSecondary = Color(0xFF0f1629); // Slightly lighter
  static const Color bgTertiary = Color(0xFF151b2e); // Even lighter
  
  // Neon accents
  static const Color neonCyan = Color(0xFF00f0ff);
  static const Color neonGreen = Color(0xFF00ff88);
  static const Color neonBlue = Color(0xFF0080ff);
  static const Color neonPurple = Color(0xFFb026ff);
  
  // Text colors
  static const Color textPrimary = Color(0xFFe0e0e0);
  static const Color textSecondary = Color(0xFFa0a0a0);
  static const Color textAccent = Color(0xFF00f0ff);
  
  // Borders and glows
  static const Color borderPrimary = Color(0xFF00f0ff);
  static const Color borderSecondary = Color(0xFF0080ff);
  static const Color borderDim = Color(0x4D00f0ff); // rgba(0, 240, 255, 0.3)
  
  // Overlays
  static const Color overlay = Color(0xE60a0e27); // rgba(10, 14, 39, 0.9)
  static const Color overlayLight = Color(0xB30a0e27); // rgba(10, 14, 39, 0.7)

  // Glow effects
  static List<BoxShadow> get glow => [
    BoxShadow(
      color: neonCyan.withOpacity(0.8),
      blurRadius: 8,
      spreadRadius: 0,
    ),
  ];

  static List<BoxShadow> get glowStrong => [
    BoxShadow(
      color: neonCyan.withOpacity(1.0),
      blurRadius: 12,
      spreadRadius: 0,
    ),
  ];

  // Borders
  static Border get defaultBorder => Border.all(
    color: borderPrimary,
    width: 1,
  );

  static Border get thickBorder => Border.all(
    color: borderPrimary,
    width: 2,
  );

  static Border get dimBorder => Border.all(
    color: borderDim,
    width: 1,
  );
}
