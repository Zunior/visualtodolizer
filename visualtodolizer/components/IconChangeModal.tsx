import LucideIcon from '@/components/LucideIcon';
import { ICON_GROUPS, getIconsForGroupAndType } from '@/constants/iconGroups';
import { Node } from '@/lib/pocketbase';
import pb from '@/lib/pocketbase';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IconChangeModalProps {
  visible: boolean;
  node: Node;
  onClose: () => void;
  onIconChanged: () => void;
}

export default function IconChangeModal({
  visible,
  node,
  onClose,
  onIconChanged,
}: IconChangeModalProps) {
  const [selectedGroup, setSelectedGroup] = useState(
    node.style?.iconGroup || ICON_GROUPS[0].id
  );
  const [selectedIcon, setSelectedIcon] = useState(
    node.style?.icon || ''
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && node) {
      setSelectedGroup(node.style?.iconGroup || ICON_GROUPS[0].id);
      setSelectedIcon(node.style?.icon || '');
    }
  }, [visible, node]);

  useEffect(() => {
    const icons = getIconsForGroupAndType(selectedGroup, node.type);
    if (icons.length > 0 && (!selectedIcon || !icons.includes(selectedIcon))) {
      setSelectedIcon(icons[0]);
    }
  }, [selectedGroup, node.type]);

  const handleSave = async () => {
    if (!selectedIcon) {
      Alert.alert('Error', 'Please select an icon');
      return;
    }

    setLoading(true);
    try {
      await pb.collection('nodes').update(node.id, {
        style: {
          ...node.style,
          icon: selectedIcon,
          iconGroup: selectedGroup,
        },
      });
      onIconChanged();
      onClose();
    } catch (e: any) {
      console.error('Error updating icon:', e);
      Alert.alert('Error', e.message || 'Failed to update icon');
    } finally {
      setLoading(false);
    }
  };

  const availableIcons = getIconsForGroupAndType(selectedGroup, node.type);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Icon</Text>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Icon Group</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.groupScroll}
          >
            {ICON_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupButton,
                  selectedGroup === group.id && styles.groupButtonSelected,
                ]}
                onPress={() => setSelectedGroup(group.id)}
              >
                <Text
                  style={[
                    styles.groupText,
                    selectedGroup === group.id && styles.groupTextSelected,
                  ]}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>
            {node.type === 'panel' ? 'Canvas Icon' : 'Text Node Icon'} (
            {availableIcons.length} available)
          </Text>
          <View style={styles.iconGrid}>
            {availableIcons.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                style={[
                  styles.iconOption,
                  selectedIcon === iconName && styles.selectedIconOption,
                ]}
                onPress={() => setSelectedIcon(iconName)}
              >
                <LucideIcon
                  iconName={iconName}
                  size={32}
                  color={selectedIcon === iconName ? '#3b82f6' : '#64748b'}
                />
                <Text
                  style={[
                    styles.iconName,
                    selectedIcon === iconName && styles.iconNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {iconName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#334155',
  },
  groupScroll: {
    marginVertical: 8,
  },
  groupButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginRight: 8,
    minWidth: 120,
  },
  groupButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  groupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  groupTextSelected: {
    color: 'white',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 100,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  selectedIconOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  iconName: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  iconNameSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
