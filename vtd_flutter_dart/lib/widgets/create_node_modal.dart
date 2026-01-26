import 'package:flutter/material.dart';
import '../models/node.dart';
import '../services/firestore_service.dart';
import '../theme/scifi_theme.dart';
import 'lucide_icon.dart';

// Available icons
const List<String> availableIcons = [
  'notepad-text',
  'list-todo',
  'link',
  'code-2',
  'book-open',
  'key',
  'scroll-text',
  'graduation-cap',
  'help-circle',
  'lightbulb',
  'sliders-horizontal',
  'code-xml',
  'folder-kanban',
  'briefcase',
  'table',
];

// Display names for icons
const Map<String, String> iconDisplayNames = {
  'notepad-text': 'note',
  'list-todo': 'todo list',
  'link': 'URL',
  'code-2': 'code',
  'book-open': 'documentation',
  'key': 'credentials',
  'scroll-text': 'script',
  'graduation-cap': 'tutorial',
  'help-circle': 'Q&A',
  'lightbulb': 'suggestions',
  'sliders-horizontal': 'config',
  'code-xml': 'general',
  'folder-kanban': 'general',
  'briefcase': 'project',
  'table': 'table',
};

class CreateNodeModal extends StatefulWidget {
  final bool visible;
  final String parentId; // Empty string for root nodes
  final VoidCallback onClose;
  final VoidCallback onNodeCreated;

  const CreateNodeModal({
    super.key,
    required this.visible,
    required this.parentId,
    required this.onClose,
    required this.onNodeCreated,
  });

  @override
  State<CreateNodeModal> createState() => _CreateNodeModalState();
}

class _CreateNodeModalState extends State<CreateNodeModal> {
  final FirestoreService _firestoreService = FirestoreService();
  final TextEditingController _titleController = TextEditingController();
  String _type = 'panel';
  String _selectedIcon = availableIcons[0];
  bool _loading = false;

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a title')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      await _firestoreService.createNode(
        title: _titleController.text.trim(),
        type: _type,
        parent: widget.parentId,
        style: NodeStyle(icon: _selectedIcon),
      );
      _titleController.clear();
      setState(() {
        _type = 'panel';
        _selectedIcon = availableIcons[0];
      });
      widget.onNodeCreated();
      widget.onClose();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.visible) return const SizedBox.shrink();

    return Dialog(
      backgroundColor: SciFiTheme.bgPrimary,
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: BoxDecoration(
          color: SciFiTheme.bgPrimary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: SciFiTheme.borderDim),
                ),
                color: SciFiTheme.bgSecondary,
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: SciFiTheme.neonCyan),
                    onPressed: widget.onClose,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    widget.parentId.isEmpty ? 'Create Root Node' : 'Create Child Node',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: SciFiTheme.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            // Form
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title input
                    const Text(
                      'Title',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: SciFiTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _titleController,
                      autofocus: true,
                      maxLines: 3,
                      style: const TextStyle(color: SciFiTheme.textPrimary),
                      decoration: InputDecoration(
                        hintText: 'Enter title...',
                        hintStyle: const TextStyle(color: SciFiTheme.textSecondary),
                        border: OutlineInputBorder(
                          borderSide: const BorderSide(color: SciFiTheme.borderDim),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderSide: const BorderSide(color: SciFiTheme.borderDim),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: const BorderSide(color: SciFiTheme.borderPrimary),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        filled: true,
                        fillColor: SciFiTheme.bgSecondary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Type selection
                    const Text(
                      'Type',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: SciFiTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildRadioOption('panel', 'Panel'),
                        const SizedBox(width: 20),
                        _buildRadioOption('text', 'Text'),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // Icon selection
                    const Text(
                      'Icon',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: SciFiTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: availableIcons.map((iconName) {
                        final isSelected = _selectedIcon == iconName;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedIcon = iconName),
                          child: Container(
                            width: 100,
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? SciFiTheme.bgTertiary : SciFiTheme.bgSecondary,
                              border: Border.all(
                                color: isSelected ? SciFiTheme.borderPrimary : SciFiTheme.borderDim,
                              ),
                              borderRadius: BorderRadius.circular(4),
                              boxShadow: isSelected ? SciFiTheme.glow : null,
                            ),
                            child: Column(
                              children: [
                                LucideIcon(
                                  iconName: iconName,
                                  size: 32,
                                  color: isSelected ? SciFiTheme.neonCyan : SciFiTheme.textSecondary,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  iconDisplayNames[iconName] ?? iconName,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isSelected ? SciFiTheme.neonCyan : SciFiTheme.textSecondary,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
            // Footer
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: SciFiTheme.borderDim),
                ),
                color: SciFiTheme.bgSecondary,
              ),
              child: ElevatedButton(
                onPressed: _loading ? null : _handleCreate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  side: const BorderSide(color: SciFiTheme.borderPrimary),
                  shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
                  elevation: 8,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  minimumSize: const Size(100, 0),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: SciFiTheme.neonCyan,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Create',
                        style: TextStyle(
                          color: SciFiTheme.neonCyan,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRadioOption(String value, String label) {
    final isSelected = _type == value;
    return GestureDetector(
      onTap: () => setState(() => _type = value),
      child: Row(
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: SciFiTheme.borderPrimary, width: 2),
            ),
            child: isSelected
                ? const Center(
                    child: CircleAvatar(
                      radius: 5,
                      backgroundColor: SciFiTheme.neonCyan,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(color: SciFiTheme.textPrimary, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
