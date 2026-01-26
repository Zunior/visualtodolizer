import 'package:flutter/material.dart';
import '../models/node.dart';
import '../services/firestore_service.dart';
import '../theme/scifi_theme.dart';
import 'node_icon.dart';

class FolderView extends StatefulWidget {
  final String parentId;
  final Function(Node)? onNodePress;

  const FolderView({
    super.key,
    required this.parentId,
    this.onNodePress,
  });

  @override
  State<FolderView> createState() => _FolderViewState();
}

class _FolderViewState extends State<FolderView> {
  final FirestoreService _firestoreService = FirestoreService();
  List<Node> _nodes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchNodes();
  }

  @override
  void didUpdateWidget(FolderView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.parentId != widget.parentId) {
      _fetchNodes();
    }
  }

  Future<void> _fetchNodes() async {
    setState(() => _loading = true);
    try {
      final nodes = await _firestoreService.getChildNodes(widget.parentId);
      if (mounted) {
        setState(() {
          _nodes = nodes;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: SciFiTheme.neonCyan),
      );
    }

    if (_nodes.isEmpty) {
      return const Center(
        child: Text(
          'No child nodes',
          style: TextStyle(color: SciFiTheme.textSecondary),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.0,
      ),
      itemCount: _nodes.length,
      itemBuilder: (context, index) {
        final node = _nodes[index];
        return NodeIcon(
          node: node,
          onPress: () => widget.onNodePress?.call(node),
          onLongPress: () {}, // Could add context menu later
          size: 128,
        );
      },
    );
  }
}
