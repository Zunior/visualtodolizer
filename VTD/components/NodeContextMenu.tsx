import { SciFiTheme } from '@/constants/scifiTheme';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NodeContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCreateChild?: () => void;
  onDelete?: () => void;
  position: { x: number; y: number };
  isRoot?: boolean;
}

export default function NodeContextMenu({
  visible,
  onClose,
  onEdit,
  onCreateChild,
  onDelete,
  position,
  isRoot = false,
}: NodeContextMenuProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.menu,
            { top: Math.max(20, position.y - 100), left: Math.max(20, position.x - 90) },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onEdit();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={SciFiTheme.colors.neonCyan} />
            <Text style={styles.menuItemText}>
              {isRoot ? 'Edit Root' : 'Edit Child'}
            </Text>
          </TouchableOpacity>
          {isRoot && onCreateChild && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onCreateChild();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={SciFiTheme.colors.neonCyan} />
              <Text style={styles.menuItemText}>Create Child</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteItem]}
              onPress={() => {
                onDelete();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
              <Text style={[styles.menuItemText, styles.deleteText]}>
                {isRoot ? 'Delete Root' : 'Delete Child'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SciFiTheme.colors.overlayLight,
  },
  menu: {
    position: 'absolute',
    backgroundColor: SciFiTheme.colors.bgSecondary,
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderPrimary,
    borderRadius: 4,
    padding: 8,
    minWidth: 180,
    ...SciFiTheme.effects.glow,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: SciFiTheme.colors.textPrimary,
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: SciFiTheme.colors.borderDim,
    marginTop: 4,
    paddingTop: 12,
  },
  deleteText: {
    color: '#ff4444',
  },
});
