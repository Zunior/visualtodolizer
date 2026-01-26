import 'package:flutter/material.dart';
import '../theme/scifi_theme.dart';

class NodeContextMenu extends StatelessWidget {
  final bool visible;
  final VoidCallback onClose;
  final VoidCallback onEdit;
  final VoidCallback? onCreateChild;
  final VoidCallback? onDelete;
  final Offset position;
  final bool isRoot;

  const NodeContextMenu({
    super.key,
    required this.visible,
    required this.onClose,
    required this.onEdit,
    this.onCreateChild,
    this.onDelete,
    required this.position,
    this.isRoot = false,
  });

  @override
  Widget build(BuildContext context) {
    if (!visible) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: SciFiTheme.overlayLight,
        child: Stack(
          children: [
            Positioned(
              top: position.dy.clamp(20.0, MediaQuery.of(context).size.height - 200),
              left: position.dx.clamp(20.0, MediaQuery.of(context).size.width - 200),
              child: GestureDetector(
                onTap: () {}, // Prevent closing when clicking menu
                child: Container(
                  decoration: BoxDecoration(
                    color: SciFiTheme.bgSecondary,
                    border: SciFiTheme.defaultBorder,
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: SciFiTheme.glow,
                  ),
                  constraints: const BoxConstraints(minWidth: 180),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Edit option
                      _MenuItem(
                        icon: Icons.edit_outlined,
                        label: isRoot ? 'Edit Root' : 'Edit Child',
                        onTap: () {
                          onEdit();
                          onClose();
                        },
                      ),
                      // Create Child option (only for root)
                      if (isRoot && onCreateChild != null) ...[
                        const Divider(
                          color: SciFiTheme.borderDim,
                          height: 1,
                          thickness: 1,
                        ),
                        _MenuItem(
                          icon: Icons.add_circle_outline,
                          label: 'Create Child',
                          onTap: () {
                            onCreateChild!();
                            onClose();
                          },
                        ),
                      ],
                      // Delete option
                      if (onDelete != null) ...[
                        const Divider(
                          color: SciFiTheme.borderDim,
                          height: 1,
                          thickness: 1,
                        ),
                        _MenuItem(
                          icon: Icons.delete_outline,
                          label: isRoot ? 'Delete Root' : 'Delete Child',
                          onTap: () {
                            onDelete!();
                            onClose();
                          },
                          isDelete: true,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDelete;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDelete = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isDelete ? Colors.red : SciFiTheme.neonCyan,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                color: isDelete ? Colors.red : SciFiTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
