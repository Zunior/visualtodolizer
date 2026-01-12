import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NodeContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onChangeIcon: () => void;
  position: { x: number; y: number };
}

export default function NodeContextMenu({
  visible,
  onClose,
  onDelete,
  onChangeIcon,
  position,
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
          style={[styles.menu, { top: Math.max(20, position.y - 100), left: Math.max(20, position.x - 90) }]}
          onStartShouldSetResponder={() => true}
        >
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              onChangeIcon();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={20} color="#334155" />
            <Text style={styles.menuItemText}>Change Icon</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              onDelete();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
    color: '#334155',
  },
  deleteText: {
    color: '#ef4444',
  },
});
