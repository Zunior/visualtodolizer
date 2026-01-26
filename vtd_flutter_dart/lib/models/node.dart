import 'package:cloud_firestore/cloud_firestore.dart';

class Node {
  final String id;
  final String title;
  final String type; // 'panel' or 'text'
  final String parent; // Empty string for root
  final String? content; // For text nodes
  final NodeStyle? style;
  final int? order; // Order for sorting (lower = first)
  final DateTime created;
  final DateTime updated;

  Node({
    required this.id,
    required this.title,
    required this.type,
    required this.parent,
    this.content,
    this.style,
    this.order,
    required this.created,
    required this.updated,
  });

  // Convert Firestore document to Node
  factory Node.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    
    // Normalize parent value
    String normalizeParent(dynamic parent) {
      if (parent == null) return '';
      if (parent == 'root') return '';
      return parent.toString();
    }

    // Convert timestamp to DateTime
    DateTime toDateTime(dynamic value) {
      if (value == null) return DateTime(0);
      if (value is DateTime) return value;
      if (value is Timestamp) return value.toDate();
      if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
      if (value is String) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime(0);
    }

    // Parse style
    NodeStyle? parseStyle(dynamic style) {
      if (style == null || style is! Map) return null;
      return NodeStyle(
        icon: style['icon'] as String?,
      );
    }

    return Node(
      id: doc.id,
      title: data['title']?.toString() ?? '',
      type: data['type']?.toString() ?? 'panel',
      parent: normalizeParent(data['parent']),
      content: data['content']?.toString(),
      style: parseStyle(data['style']),
      order: data['order'] is int ? data['order'] as int : null,
      created: toDateTime(data['created']),
      updated: toDateTime(data['updated']),
    );
  }

  // Convert Node to Firestore map
  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'type': type,
      'parent': parent.isEmpty ? null : parent,
      'content': content,
      'style': style?.toMap(),
      'order': order,
      'created': Timestamp.fromDate(created),
      'updated': Timestamp.fromDate(updated),
    };
  }
}

class NodeStyle {
  final String? icon; // Lucide icon name

  NodeStyle({this.icon});

  Map<String, dynamic>? toMap() {
    if (icon == null) return null;
    return {'icon': icon};
  }
}
