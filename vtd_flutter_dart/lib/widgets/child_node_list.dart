import 'package:flutter/material.dart';
import '../models/node.dart';
import '../theme/scifi_theme.dart';
import 'draggable_node_icon.dart';

class ChildNodeList extends StatefulWidget {
  final bool visible;
  final List<Node> childNodes;
  final Function(Node) onChildPress;
  final Function(Node) onChildLongPress;
  final Function(List<Node>)? onOrderChange;
  final String? openedChildId;

  const ChildNodeList({
    super.key,
    required this.visible,
    required this.childNodes,
    required this.onChildPress,
    required this.onChildLongPress,
    this.onOrderChange,
    this.openedChildId,
  });

  @override
  State<ChildNodeList> createState() => _ChildNodeListState();
}

class _ChildNodeListState extends State<ChildNodeList> {
  List<Node> _nodes = [];
  bool _isReordering = false;
  String? _draggedNodeId;
  int? _hoveredIndex;
  int? _currentDraggedIndex; // Track where the dragged item currently is in the list
  int? _originalDraggedIndex; // Track where the dragged item started (for hiding only at original position)
  bool _isDragging = false; // Track if we're currently dragging
  bool _justFinishedDragging = false; // Track if we just finished dragging to prevent didUpdateWidget reset
  bool _wasAccepted = false; // Track if onAccept was called to prevent duplicate onOrderChange calls
  String? _lastHoveredNodeId; // Track the last node we hovered over during drag

  @override
  void initState() {
    super.initState();
    _nodes = List.from(widget.childNodes);
  }

  @override
  void didUpdateWidget(ChildNodeList oldWidget) {
    super.didUpdateWidget(oldWidget);
    print('🔵 didUpdateWidget called: _isReordering=$_isReordering, _isDragging=$_isDragging, _justFinishedDragging=$_justFinishedDragging');
    print('   Parent nodes: ${widget.childNodes.map((n) => n.id).toList()}');
    print('   Local nodes: ${_nodes.map((n) => n.id).toList()}');
    
    // CRITICAL: Don't update if we're in the middle of a reorder operation, dragging, or just finished dragging
    // This prevents the parent's update from resetting our local state after a drag
    if (_isReordering || _isDragging || _justFinishedDragging) {
      print('   ⚠️ Skipping update due to flags');
      return;
    }
    
    // If parent sends empty list and we're not in a drag operation, clear our list
    // This allows root switching to clear the child list
    if (widget.childNodes.isEmpty) {
      if (_nodes.isNotEmpty) {
        print('   ✅ Parent sent empty list - clearing local list (root switch)');
        _nodes = [];
        return;
      }
      return; // Both are empty, nothing to do
    }
    
    // Only update if nodes were added or removed (not just reordered)
    final oldIds = oldWidget.childNodes.map((n) => n.id).toSet();
    final newIds = widget.childNodes.map((n) => n.id).toSet();
    
    // If items were added/removed, update the list
    if (oldIds.length != newIds.length || !oldIds.containsAll(newIds)) {
      print('   ✅ Updating list (items added/removed)');
      _nodes = List.from(widget.childNodes);
    } else {
      // Same items, might be reordered - update to match parent order
      print('   ✅ Updating list (same items, possible reorder)');
      _nodes = List.from(widget.childNodes);
    }
    // If it's just a reorder, we keep our local order (don't reset from parent)
    // This is important because our local order is the source of truth after drag operations
  }

  void _handleReorder(int oldIndex, int newIndex, {bool isLiveUpdate = false}) {
    if (oldIndex == newIndex) {
      return;
    }
    
    // Set flag before updating to prevent didUpdateWidget from resetting
    _isReordering = true;
    
    // Update the list immediately
    final item = _nodes.removeAt(oldIndex);
    
    // Calculate insertion index
    // When moving forward (oldIndex < newIndex): after removal, items shift left
    //   So newIndex becomes newIndex (still valid for insertion)
    // When moving backward (oldIndex > newIndex): items don't shift, insert at newIndex
    // Example: [A(0), B(1), C(2)] drag C over B
    // Remove C: [A(0), B(1)]
    // Insert C at 1: [A(0), C(1), B(2)] - C goes to B's position, B shifts right ✓
    final adjustedNewIndex = newIndex;
    _nodes.insert(adjustedNewIndex, item);
    
    // Update the current position of dragged item
    if (_draggedNodeId == item.id) {
      _currentDraggedIndex = adjustedNewIndex;
    }
    
    // Update UI immediately for live updates
    setState(() {});
    
    // Only persist to parent on final drop, not during live updates
    if (!isLiveUpdate) {
      widget.onOrderChange?.call(List.from(_nodes));
      
      // Reset flag after a delay
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          setState(() {
            _isReordering = false;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.visible) return const SizedBox.shrink();

    return Container(
      height: 120,
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: SciFiTheme.borderDim),
        ),
        color: SciFiTheme.bgSecondary,
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        itemCount: _nodes.length,
        itemBuilder: (context, index) {
          final node = _nodes[index];
          
          // Don't hide the dragged item - keep it in the tree so onDragEnd can fire
          // We'll hide it visually in _buildDraggableIcon instead
          
          // Debug: Log when rendering each item
          if (index == 0 || _isDragging) {
            print('   📦 Rendering item at index $index: ${node.id}, _isDragging=$_isDragging, _draggedNodeId=$_draggedNodeId');
          }
          
          final isSelected = widget.openedChildId == node.id;
          final isHovered = _hoveredIndex == index;
          return DragTarget<Node>(
            key: ValueKey(node.id),
            onWillAccept: (draggedNode) {
              print('   🔍 onWillAccept: draggedNode=${draggedNode?.id}, targetNode=${node.id}');
              print('      draggedNode.parent=${draggedNode?.parent}, targetNode.parent=${node.parent}');
              print('      draggedNode.id != node.id: ${draggedNode?.id != node.id}');
              
              // Only accept if it's from the same list (same parent) and different node
              if (draggedNode != null && 
                  draggedNode.parent == node.parent && 
                  draggedNode.id != node.id) {
                print('      ✅ Will accept');
                return true;
              }
              print('      ❌ Will NOT accept');
              return false;
            },
            onAccept: (draggedNode) {
              print('🟢 onAccept called for node: ${draggedNode.id}');
              print('   Current _nodes: ${_nodes.map((n) => n.id).toList()}');
              print('   _isDragging: $_isDragging, _draggedNodeId: $_draggedNodeId');
              
              // Mark that we accepted the drop
              _wasAccepted = true;
              
              // Ensure dragged item is in the list (it should be from live updates)
              var draggedItemIndex = _nodes.indexWhere((n) => n.id == draggedNode.id);
              print('   draggedItemIndex: $draggedItemIndex');
              if (draggedItemIndex == -1) {
                print('   ⚠️ Item not in list, inserting...');
                // Item not in list - insert it at target position
                final targetNodeIndex = _nodes.indexWhere((n) => n.id == node.id);
                final insertIndex = targetNodeIndex != -1 ? targetNodeIndex : _nodes.length;
                _nodes.insert(insertIndex, draggedNode);
                draggedItemIndex = insertIndex;
                print('   ✅ Inserted at index: $insertIndex');
              }
              
              // Find where the target node currently is
              final targetNodeIndex = _nodes.indexWhere((n) => n.id == node.id);
              
              // If dragged item is not at target position, move it
              if (targetNodeIndex != -1 && draggedItemIndex != targetNodeIndex) {
                print('   Moving item from $draggedItemIndex to $targetNodeIndex');
                _handleReorder(draggedItemIndex, targetNodeIndex, isLiveUpdate: false);
              }
              
              // Set flag FIRST to prevent didUpdateWidget from resetting during the entire process
              _justFinishedDragging = true;
              print('   Set _justFinishedDragging = true');
              
              // Clear dragging state to make item visible immediately
              setState(() {
                _isDragging = false;
                _draggedNodeId = null;
                _hoveredIndex = null;
                _currentDraggedIndex = null;
                _originalDraggedIndex = null;
              });
              print('   ✅ Cleared drag state, _nodes: ${_nodes.map((n) => n.id).toList()}');
              
              // Wait for UI to update, then notify parent
              Future.delayed(const Duration(milliseconds: 100), () {
                if (mounted) {
                  // Verify item is still in list
                  final itemStillInList = _nodes.any((n) => n.id == draggedNode.id);
                  print('   After delay - itemStillInList: $itemStillInList');
                  print('   _nodes: ${_nodes.map((n) => n.id).toList()}');
                  if (!itemStillInList) {
                    print('   ⚠️ Item missing! Restoring...');
                    // Restore item if somehow missing
                    final targetIdx = _nodes.indexWhere((n) => n.id == node.id);
                    if (targetIdx != -1) {
                      _nodes.insert(targetIdx, draggedNode);
                    } else {
                      _nodes.add(draggedNode);
                    }
                    setState(() {});
                    print('   ✅ Restored, _nodes: ${_nodes.map((n) => n.id).toList()}');
                  }
                  
                  // Notify parent with the final order
                  print('   📤 Calling onOrderChange with: ${_nodes.map((n) => n.id).toList()}');
                  widget.onOrderChange?.call(List.from(_nodes));
                  
                  // Keep the flag set for a longer time to prevent any parent updates from resetting
                  Future.delayed(const Duration(milliseconds: 1000), () {
                    if (mounted) {
                      print('   🔓 Clearing _justFinishedDragging flag');
                      setState(() {
                        _justFinishedDragging = false;
                        _wasAccepted = false;
                      });
                    }
                  });
                }
              });
            },
            onMove: (details) {
              // Track the last hovered node for final drop handling
              _lastHoveredNodeId = node.id;
              
              // Live reordering: shift items as we drag over them
              if (_draggedNodeId != null && _draggedNodeId != node.id) {
                // Find current position of dragged item
                final draggedIndex = _currentDraggedIndex ?? _nodes.indexWhere((n) => n.id == _draggedNodeId);
                
                // Find current position of target node (it may have shifted from previous reorders)
                final targetNodeIndex = _nodes.indexWhere((n) => n.id == node.id);
                
                if (draggedIndex != -1 && targetNodeIndex != -1 && draggedIndex != targetNodeIndex) {
                  // Remove dragged item from list (keep it hidden)
                  final draggedNode = _nodes.removeAt(draggedIndex);
                  
                  // Calculate where to insert based on target node's current position
                  int insertIndex = targetNodeIndex;
                  
                  // Adjust if we removed from before the target
                  if (draggedIndex < targetNodeIndex) {
                    // After removal, target shifted left by 1
                    insertIndex = targetNodeIndex;
                  } else {
                    // After removal, target position unchanged
                    insertIndex = targetNodeIndex;
                  }
                  
                  // Insert dragged item at target position (shifts other items)
                  _nodes.insert(insertIndex, draggedNode);
                  
                  // Update current position (but item is hidden in itemBuilder)
                  _currentDraggedIndex = insertIndex;
                  
                  // Update UI immediately
                  setState(() {});
                }
              }
              
              // Track which index we're hovering over
              if (_hoveredIndex != index) {
                setState(() {
                  _hoveredIndex = index;
                });
              }
            },
            onLeave: (draggedNode) {
              // Clear hover state when leaving this target
              if (_hoveredIndex == index) {
                setState(() {
                  _hoveredIndex = null;
                });
              }
            },
            builder: (context, candidateData, rejectedData) {
              final isHighlighted = candidateData.isNotEmpty || isHovered;
              final isDraggedItem = _isDragging && 
                  _draggedNodeId != null && 
                  _draggedNodeId == node.id;
              
              // Don't show decoration if this is the dragged item
              if (isDraggedItem) {
                return Container(
                  key: ValueKey('container_${node.id}'),
                  margin: const EdgeInsets.only(right: 12),
                  width: 100,
                  height: 100,
                  child: _buildDraggableIcon(node, index),
                );
              }
              
              return Container(
                key: ValueKey('container_${node.id}'),
                margin: const EdgeInsets.only(right: 12),
                decoration: isSelected
                    ? BoxDecoration(
                        boxShadow: SciFiTheme.glowStrong,
                      )
                    : isHighlighted
                        ? BoxDecoration(
                            border: Border.all(color: SciFiTheme.neonCyan, width: 2),
                            borderRadius: BorderRadius.circular(4),
                          )
                        : null,
                child: _buildDraggableIcon(node, index),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildDraggableIcon(Node node, int index) {
    // Hide the dragged item visually during dragging (it's shown as drag feedback only)
    // But keep the widget in the tree so onDragEnd can fire
    final isDraggedItem = _isDragging && 
        _draggedNodeId != null && 
        _draggedNodeId == node.id;
    
    return DraggableNodeIcon(
      node: node,
      onPress: () => widget.onChildPress(node),
      onLongPress: () => widget.onChildLongPress(node),
      size: 100,
      onDragStarted: () {
        print('🟡 onDragStarted for node: ${node.id} at index: $index');
        // Reset acceptance flag for new drag
        _wasAccepted = false;
        _lastHoveredNodeId = null;
        
        // Track the dragged node and its initial position
        setState(() {
          _isDragging = true;
          _draggedNodeId = node.id;
          _currentDraggedIndex = index;
          _originalDraggedIndex = index; // Remember where it started
        });
        print('   Set _isDragging=true, _draggedNodeId=${node.id}');
      },
      onDragEnd: (DraggableDetails details) {
        print('🔴 onDragEnd called for node: ${node.id}');
        print('   details.wasAccepted: ${details.wasAccepted}');
        print('   _wasAccepted: $_wasAccepted');
        print('   _lastHoveredNodeId: $_lastHoveredNodeId');
        print('   _nodes: ${_nodes.map((n) => n.id).toList()}');
        
        // If onAccept was already called, don't do anything here
        if (_wasAccepted) {
          print('   ⏭️ onAccept already handled this');
          return;
        }
        
        print('   ⚠️ onAccept was NOT called - handling in onDragEnd');
        
        // If we have a last hovered node and it's different from the dragged node, finalize the reorder
        if (_lastHoveredNodeId != null && _lastHoveredNodeId != node.id) {
          print('   Finalizing drop to node: $_lastHoveredNodeId');
          final targetNodeIndex = _nodes.indexWhere((n) => n.id == _lastHoveredNodeId);
          final draggedItemIndex = _nodes.indexWhere((n) => n.id == node.id);
          
          if (targetNodeIndex != -1 && draggedItemIndex != -1 && draggedItemIndex != targetNodeIndex) {
            print('   Moving from $draggedItemIndex to $targetNodeIndex');
            _handleReorder(draggedItemIndex, targetNodeIndex, isLiveUpdate: false);
          }
        }
        
        // Ensure the dragged item is in the list
        final itemInList = _nodes.any((n) => n.id == node.id);
        print('   itemInList: $itemInList');
        if (!itemInList && _currentDraggedIndex != null) {
          print('   Restoring item at index: $_currentDraggedIndex');
          // Item was removed but not reinserted - restore it at the last known position
          final restoreIndex = _currentDraggedIndex! < _nodes.length ? _currentDraggedIndex! : _nodes.length;
          _nodes.insert(restoreIndex, node);
        }
        
        // Set flag to prevent didUpdateWidget from resetting
        _justFinishedDragging = true;
        
        // Clear dragging state FIRST to make item visible
        setState(() {
          _isDragging = false;
          _draggedNodeId = null;
          _hoveredIndex = null;
          _currentDraggedIndex = null;
          _originalDraggedIndex = null;
          _lastHoveredNodeId = null;
        });
        print('   ✅ Cleared drag state, _nodes: ${_nodes.map((n) => n.id).toList()}');
        
        // Delay onOrderChange slightly to ensure UI has updated
        Future.microtask(() {
          // Then persist the final order (after item is visible)
          print('   📤 Calling onOrderChange from onDragEnd');
          widget.onOrderChange?.call(List.from(_nodes));
          
          // Clear the flag after a longer delay to prevent didUpdateWidget from resetting
          Future.delayed(const Duration(milliseconds: 1000), () {
            if (mounted) {
              setState(() {
                _justFinishedDragging = false;
              });
            }
          });
        });
      },
    );
  }
}
