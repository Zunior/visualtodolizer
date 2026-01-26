import 'package:flutter/material.dart';
import '../models/node.dart';
import '../theme/scifi_theme.dart';
import 'lucide_icon.dart';

class DraggableNodeIcon extends StatelessWidget {
  final Node node;
  final VoidCallback onPress;
  final VoidCallback onLongPress;
  final double size;
  final bool isDragging;
  final Function(DraggableDetails)? onDragEnd;
  final VoidCallback? onDragStarted;

  const DraggableNodeIcon({
    super.key,
    required this.node,
    required this.onPress,
    required this.onLongPress,
    this.size = 128,
    this.isDragging = false,
    this.onDragEnd,
    this.onDragStarted,
  });

  @override
  Widget build(BuildContext context) {
    final iconWidget = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: SciFiTheme.bgSecondary,
        border: SciFiTheme.defaultBorder,
        borderRadius: BorderRadius.circular(4),
        boxShadow: SciFiTheme.glowStrong,
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
    );

    return Draggable<Node>(
      data: node,
      feedback: Material(
        color: Colors.transparent,
        child: Opacity(
          opacity: 0.9,
          child: Transform.scale(
            scale: 1.1,
            child: iconWidget,
          ),
        ),
      ),
      childWhenDragging: const SizedBox.shrink(), // No duplicate - empty space
      onDragStarted: () {
        // Call the callback if provided
        onDragStarted?.call();
      },
      onDragEnd: (details) {
        try {
          print('🔴 DraggableNodeIcon.onDragEnd called for node: ${node.id}');
          print('   details.wasAccepted: ${details.wasAccepted}');
          print('   details.offset: ${details.offset}');
          print('   details.velocity: ${details.velocity}');
          // Call the callback if provided
          if (onDragEnd != null) {
            print('   Calling onDragEnd callback');
            onDragEnd!(details);
          } else {
            print('   ⚠️ onDragEnd callback is null!');
          }
        } catch (e, stackTrace) {
          print('   ❌ ERROR in onDragEnd: $e');
          print('   Stack: $stackTrace');
        }
        // If not accepted by any target, the widget will return to original position
        // This is handled automatically by Flutter
      },
      child: GestureDetector(
        onTap: onPress,
        onLongPress: onLongPress,
        child: iconWidget,
      ),
    );
  }
}
