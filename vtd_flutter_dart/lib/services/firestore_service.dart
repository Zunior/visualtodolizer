import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/node.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String _collection = 'node';

  // Normalize parent value (same as React Native app)
  String _normalizeParent(String? parent) {
    if (parent == null) return '';
    if (parent == 'root') return '';
    return parent;
  }

  // Get root nodes (parent === "")
  Future<List<Node>> getRootNodes() async {
    final nodesCollection = _db.collection(_collection);
    
    // Query for root nodes (parent === "" or null or "root")
    final queries = [
      nodesCollection.where('parent', isEqualTo: ''),
      nodesCollection.where('parent', isNull: true),
      nodesCollection.where('parent', isEqualTo: 'root'),
    ];

    final snapshots = await Future.wait(queries.map((q) => q.get()));
    
    final nodesMap = <String, Node>{};
    
    for (final snapshot in snapshots) {
      for (final doc in snapshot.docs) {
        final data = doc.data();
        final normalizedParent = _normalizeParent(data['parent']?.toString());
        if (normalizedParent.isEmpty) {
          try {
            nodesMap[doc.id] = Node.fromFirestore(doc);
          } catch (e) {
            print('Skipping malformed node: ${doc.id} - $e');
          }
        }
      }
    }

    // Fallback: if no root nodes found, fetch all and filter client-side
    if (nodesMap.isEmpty) {
      final allSnapshot = await nodesCollection.get();
      for (final doc in allSnapshot.docs) {
        final data = doc.data();
        final normalizedParent = _normalizeParent(data['parent']?.toString());
        if (normalizedParent.isEmpty) {
          try {
            nodesMap[doc.id] = Node.fromFirestore(doc);
          } catch (e) {
            // ignore
          }
        }
      }
    }

    final nodes = nodesMap.values.toList();
    
    // Sort by order (if present), then by created date (newest first)
    nodes.sort((a, b) {
      // If both have order, sort by order
      if (a.order != null && b.order != null) {
        return a.order!.compareTo(b.order!);
      }
      // If only one has order, prioritize it
      if (a.order != null) return -1;
      if (b.order != null) return 1;
      // Otherwise sort by created date (newest first)
      return b.created.compareTo(a.created);
    });

    return nodes;
  }

  // Get child nodes of a parent
  Future<List<Node>> getChildNodes(String parentId) async {
    final nodesCollection = _db.collection(_collection);
    final snapshot = await nodesCollection.where('parent', isEqualTo: parentId).get();

    final nodes = <Node>[];
    for (final doc in snapshot.docs) {
      try {
        nodes.add(Node.fromFirestore(doc));
      } catch (e) {
        print('Skipping malformed node: ${doc.id} - $e');
      }
    }

    // Sort by order (if present), then by created date (newest first)
    nodes.sort((a, b) {
      // If both have order, sort by order
      if (a.order != null && b.order != null) {
        return a.order!.compareTo(b.order!);
      }
      // If only one has order, prioritize it
      if (a.order != null) return -1;
      if (b.order != null) return 1;
      // Otherwise sort by created date (newest first)
      return b.created.compareTo(a.created);
    });

    return nodes;
  }

  // Get a single node by ID
  Future<Node> getNode(String id) async {
    final docRef = _db.collection(_collection).doc(id);
    final doc = await docRef.get();
    
    if (!doc.exists) {
      throw Exception('Node not found: $id');
    }

    return Node.fromFirestore(doc);
  }

  // Create a new node
  Future<Node> createNode({
    required String title,
    required String type,
    required String parent,
    String? content,
    NodeStyle? style,
  }) async {
    final nodesCollection = _db.collection(_collection);
    final now = DateTime.now();
    
    final nodeData = {
      'title': title,
      'type': type,
      'parent': _normalizeParent(parent).isEmpty ? null : _normalizeParent(parent),
      'content': content,
      'style': style?.toMap(),
      'created': Timestamp.fromDate(now),
      'updated': Timestamp.fromDate(now),
    };

    final docRef = await nodesCollection.add(nodeData);
    return getNode(docRef.id);
  }

  // Update a node
  Future<void> updateNode(
    String id, {
    String? title,
    String? type,
    String? parent,
    String? content,
    NodeStyle? style,
    int? order,
  }) async {
    final nodeRef = _db.collection(_collection).doc(id);
    final updateData = <String, dynamic>{
      'updated': Timestamp.fromDate(DateTime.now()),
    };

    if (title != null) updateData['title'] = title;
    if (type != null) updateData['type'] = type;
    if (parent != null) updateData['parent'] = _normalizeParent(parent).isEmpty ? null : _normalizeParent(parent);
    if (content != null) updateData['content'] = content;
    if (style != null) updateData['style'] = style.toMap();
    if (order != null) updateData['order'] = order;

    await nodeRef.update(updateData);
  }

  // Update order for multiple nodes (batch update)
  Future<void> updateNodesOrder(List<Map<String, dynamic>> updates) async {
    final batch = _db.batch();
    
    for (final update in updates) {
      final nodeRef = _db.collection(_collection).doc(update['id'] as String);
      batch.update(nodeRef, {
        'order': update['order'] as int,
        'updated': Timestamp.fromDate(DateTime.now()),
      });
    }
    
    await batch.commit();
  }

  // Delete a node
  Future<void> deleteNode(String id) async {
    final nodeRef = _db.collection(_collection).doc(id);
    await nodeRef.delete();
  }

  // Delete a node and all its children (cascade delete)
  Future<void> deleteNodeCascade(String id) async {
    // First, delete all children
    final children = await getChildNodes(id);
    for (final child in children) {
      await deleteNodeCascade(child.id);
    }
    // Then delete this node
    await deleteNode(id);
  }
}
