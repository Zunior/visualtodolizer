import 'package:flutter/material.dart';
import '../models/node.dart';
import '../services/firestore_service.dart';
import '../theme/scifi_theme.dart';
import 'lucide_icon.dart';
import 'create_node_modal.dart'; // For availableIcons and iconDisplayNames

class IconChangeModal extends StatefulWidget {
  final bool visible;
  final Node? node;
  final VoidCallback onClose;
  final VoidCallback onIconChanged;

  const IconChangeModal({
    super.key,
    required this.visible,
    this.node,
    required this.onClose,
    required this.onIconChanged,
  });

  @override
  State<IconChangeModal> createState() => _IconChangeModalState();
}

class _IconChangeModalState extends State<IconChangeModal> {
  final FirestoreService _firestoreService = FirestoreService();
  final TextEditingController _titleController = TextEditingController();
  String _selectedIcon = availableIcons[0];
  bool _loading = false;

  @override
  void didUpdateWidget(IconChangeModal oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.visible && widget.node != null) {
      final currentIcon = widget.node!.style?.icon ?? '';
      setState(() {
        _selectedIcon = availableIcons.contains(currentIcon) ? currentIcon : availableIcons[0];
        _titleController.text = widget.node!.title;
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (widget.node == null) return;

    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a title')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      await _firestoreService.updateNode(
        widget.node!.id,
        title: _titleController.text.trim(),
        style: NodeStyle(icon: _selectedIcon),
      );
      widget.onIconChanged();
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
    if (!widget.visible || widget.node == null) return const SizedBox.shrink();

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
                  const Text(
                    'Edit Icon',
                    style: TextStyle(
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
                onPressed: _loading ? null : _handleSave,
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
                        'Save',
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
}
