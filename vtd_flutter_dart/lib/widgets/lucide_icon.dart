import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class LucideIcon extends StatelessWidget {
  final String? iconName;
  final double size;
  final Color color;

  const LucideIcon({
    super.key,
    this.iconName,
    this.size = 40,
    this.color = const Color(0xFF3b82f6),
  });

  @override
  Widget build(BuildContext context) {
    final icon = iconName ?? 'circle';
    
    // Convert kebab-case to camelCase for icon name (Lucide uses camelCase)
    final iconComponentName = _toCamelCase(icon);

    // Map icon names to LucideIcons
    IconData? iconData = _getIconData(iconComponentName);

    return Icon(
      iconData ?? LucideIcons.circle,
      size: size,
      color: color,
    );
  }

  String _toCamelCase(String kebabCase) {
    final parts = kebabCase.split('-');
    if (parts.isEmpty) return kebabCase;
    return parts[0] + parts.sublist(1).map((word) => 
      word.isEmpty ? '' : word[0].toUpperCase() + word.substring(1)
    ).join('');
  }

  IconData? _getIconData(String iconName) {
    // Normalize to camelCase (Lucide uses camelCase)
    final normalized = iconName.isEmpty 
        ? iconName 
        : iconName[0].toLowerCase() + iconName.substring(1);
    
    // Map icon names to LucideIcons with correct names
    switch (normalized) {
      case 'circle':
        return LucideIcons.circle;
      case 'square':
        return LucideIcons.square;
      case 'triangle':
        return LucideIcons.triangle;
      case 'star':
        return LucideIcons.star;
      case 'heart':
        return LucideIcons.heart;
      case 'file':
        return LucideIcons.file;
      case 'folder':
        return LucideIcons.folder;
      case 'home':
        return LucideIcons.house; // Use house instead of home
      case 'settings':
        return LucideIcons.settings;
      case 'user':
        return LucideIcons.user;
      case 'check':
        return LucideIcons.check;
      case 'x':
        return LucideIcons.x;
      case 'plus':
        return LucideIcons.plus;
      case 'minus':
        return LucideIcons.minus;
      case 'edit':
        return LucideIcons.pencil; // Use pencil instead of edit
      case 'trash':
        return LucideIcons.trash;
      case 'copy':
        return LucideIcons.copy;
      case 'search':
        return LucideIcons.search;
      case 'menu':
        return LucideIcons.menu;
      case 'arrowRight':
        return LucideIcons.arrowRight;
      case 'arrowLeft':
        return LucideIcons.arrowLeft;
      case 'arrowUp':
        return LucideIcons.arrowUp;
      case 'arrowDown':
        return LucideIcons.arrowDown;
      // Add more icons as needed
      case 'notepadText':
        return LucideIcons.fileText;
      case 'listTodo':
        return LucideIcons.listTodo;
      case 'link':
        return LucideIcons.link;
      case 'code2':
        return LucideIcons.code;
      case 'bookOpen':
        return LucideIcons.bookOpen;
      case 'key':
        return LucideIcons.key;
      case 'scrollText':
        return LucideIcons.scrollText;
      case 'graduationCap':
        return LucideIcons.graduationCap;
      case 'helpCircle':
        return LucideIcons.circle; // Fallback - helpCircle/help/info may not exist
      case 'lightbulb':
        return LucideIcons.lightbulb;
      case 'slidersHorizontal':
        return LucideIcons.slidersHorizontal;
      case 'codeXml':
        return LucideIcons.code;
      case 'folderKanban':
        return LucideIcons.folderKanban;
      case 'briefcase':
        return LucideIcons.briefcase;
      default:
        return null; // Will use fallback circle
    }
  }
}
