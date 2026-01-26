import 'package:flutter/material.dart';
import '../models/node.dart';
import '../theme/scifi_theme.dart';
import 'lucide_icon.dart';

class NodeIcon extends StatelessWidget {
  final Node node;
  final VoidCallback onPress;
  final VoidCallback onLongPress;
  final double size;

  const NodeIcon({
    super.key,
    required this.node,
    required this.onPress,
    required this.onLongPress,
    this.size = 128,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      onLongPress: onLongPress,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: SciFiTheme.bgSecondary,
          border: SciFiTheme.defaultBorder,
          borderRadius: BorderRadius.circular(4),
          boxShadow: SciFiTheme.glow,
        ),
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            LucideIcon(
              iconName: node.style?.icon,
              size: 40,
              color: SciFiTheme.neonCyan,
            ),
            const SizedBox(height: 8),
            Flexible(
              child: Text(
                node.title,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: SciFiTheme.neonCyan,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
