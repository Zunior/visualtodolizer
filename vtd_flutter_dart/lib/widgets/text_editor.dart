import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../models/node.dart';
import '../services/firestore_service.dart';
import '../theme/scifi_theme.dart';
import '../utils/link_parser.dart';

class TextEditor extends StatefulWidget {
  final String nodeId;
  final String? initialContent;
  final VoidCallback? onClose;

  const TextEditor({
    super.key,
    required this.nodeId,
    this.initialContent,
    this.onClose,
  });

  @override
  State<TextEditor> createState() => _TextEditorState();
}

class _TextEditorState extends State<TextEditor> {
  final FirestoreService _firestoreService = FirestoreService();
  final TextEditingController _controller = TextEditingController();
  bool _isEditing = false;
  bool _saving = false;
  bool _loading = true;
  String _savedContent = '';

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    setState(() => _loading = true);
    try {
      final node = await _firestoreService.getNode(widget.nodeId);
      final content = node.content ?? '';
      _controller.text = content;
      _savedContent = content;
      _isEditing = content.isEmpty;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading content: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _handleSave() async {
    setState(() => _saving = true);
    try {
      await _firestoreService.updateNode(widget.nodeId, content: _controller.text);
      setState(() {
        _savedContent = _controller.text;
        _isEditing = false;
      });
      if (widget.onClose != null) {
        widget.onClose!();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Content saved successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  Future<void> _handleCopy() async {
    try {
      await Share.share(_controller.text);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error copying: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: SciFiTheme.neonCyan),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: SciFiTheme.bgSecondary,
        border: SciFiTheme.defaultBorder,
        borderRadius: BorderRadius.circular(4),
        boxShadow: SciFiTheme.glow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header with copy and close buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              IconButton(
                icon: const Icon(Icons.copy, color: SciFiTheme.neonCyan),
                onPressed: _handleCopy,
              ),
              if (widget.onClose != null)
                IconButton(
                  icon: const Icon(Icons.close, color: SciFiTheme.neonCyan),
                  onPressed: widget.onClose,
                ),
            ],
          ),
          // Text input/display
          Expanded(
            child: _isEditing
                ? TextField(
                    controller: _controller,
                    maxLines: null,
                    expands: true,
                    style: const TextStyle(color: SciFiTheme.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Enter your text here...',
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
                      fillColor: SciFiTheme.bgTertiary,
                    ),
                    onChanged: (value) {
                      // Auto-save on change (debounced in production)
                    },
                  )
                : GestureDetector(
                    onTap: () => setState(() => _isEditing = true),
                    child: Container(
                      decoration: BoxDecoration(
                        color: SciFiTheme.bgTertiary,
                        border: Border.all(color: SciFiTheme.borderDim),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: SingleChildScrollView(
                        child: _buildLinkedText(_savedContent.isEmpty ? 'Click to edit...' : _savedContent),
                      ),
                    ),
                  ),
          ),
          const SizedBox(height: 16),
          // Save button
          ElevatedButton(
            onPressed: _saving ? null : _handleSave,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              side: const BorderSide(color: SciFiTheme.borderPrimary),
              shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
              elevation: 8,
            ),
            child: Text(
              _saving ? 'Saving...' : 'Save',
              style: const TextStyle(color: SciFiTheme.neonCyan),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLinkedText(String text) {
    final segments = parseTextForLinks(text);
    return RichText(
      text: TextSpan(
        style: const TextStyle(color: SciFiTheme.textPrimary, fontSize: 16),
        children: segments.map((segment) {
          if (segment.type == 'text') {
            return TextSpan(text: segment.text);
          } else if (segment.type == 'url') {
            return TextSpan(
              text: segment.text,
              style: const TextStyle(
                color: SciFiTheme.neonCyan,
                decoration: TextDecoration.underline,
              ),
              recognizer: TapGestureRecognizer()
                ..onTap = () async {
                  final uri = Uri.tryParse(segment.value);
                  if (uri != null && await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  }
                },
            );
          } else {
            // Windows path - just underline, not clickable
            return TextSpan(
              text: segment.text,
              style: const TextStyle(
                color: SciFiTheme.neonCyan,
                decoration: TextDecoration.underline,
              ),
            );
          }
        }).toList(),
      ),
    );
  }
}
