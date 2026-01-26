import 'package:flutter/material.dart';
import '../theme/scifi_theme.dart';

class MenuIcon extends StatefulWidget {
  final VoidCallback onPress;
  final VoidCallback onLongPress;
  final double size;

  const MenuIcon({
    super.key,
    required this.onPress,
    required this.onLongPress,
    this.size = 100,
  });

  @override
  State<MenuIcon> createState() => _MenuIconState();
}

class _MenuIconState extends State<MenuIcon> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onPress,
      onLongPress: widget.onLongPress,
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          color: SciFiTheme.bgSecondary,
          border: SciFiTheme.defaultBorder,
          borderRadius: BorderRadius.circular(4),
          boxShadow: SciFiTheme.glow,
        ),
        child: const Icon(
          Icons.menu,
          size: 40,
          color: SciFiTheme.neonCyan,
        ),
      ),
    );
  }
}
