import React, { useState } from 'react';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LucideIcon from './LucideIcon';
import { SciFiTheme } from '@/constants/scifiTheme';
import { createNode } from '@/lib/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Final list of available icons
const AVAILABLE_ICONS = [
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
];

// Display names for icons
const ICON_DISPLAY_NAMES: Record<string, string> = {
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
};

interface CreateNodeModalProps {
  visible: boolean;
  parentId: string; // Empty string for root nodes
  onClose: () => void;
  onNodeCreated: () => void;
}

export default function CreateNodeModal({
  visible,
  parentId,
  onClose,
  onNodeCreated,
}: CreateNodeModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'panel' | 'text'>('panel');
  const [selectedIcon, setSelectedIcon] = useState<string>(AVAILABLE_ICONS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!selectedIcon) {
      Alert.alert('Error', 'Please select an icon');
      return;
    }

    setLoading(true);
    try {
      await createNode({
        title: title.trim(),
        type,
        parent: parentId,
        style: {
          icon: selectedIcon,
        },
      });
      setTitle('');
      setType('panel');
      setSelectedIcon(AVAILABLE_ICONS[0]);
      onNodeCreated();
      onClose();
    } catch (e: any) {
      console.error('Error creating node:', e);
      Alert.alert('Error', e.message || 'Failed to create node');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={SciFiTheme.colors.neonCyan} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {parentId === '' ? 'Create Root Node' : 'Create Child Node'}
          </Text>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter title..."
              placeholderTextColor={SciFiTheme.colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              multiline
              autoFocus
              {...(Platform.OS === 'web' && { outlineStyle: 'none' })}
            />
          </View>

          <Text style={styles.label}>Type</Text>
          <View style={styles.radioContainer}>
            {['panel', 'text'].map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.radioOption}
                onPress={() => setType(t as 'panel' | 'text')}
              >
                <View style={styles.radioButton}>
                  {type === t && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.radioLabel}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Icon</Text>
          <ScrollView style={styles.iconGridContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((iconName) => (
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
                    color={
                      selectedIcon === iconName
                        ? SciFiTheme.colors.neonCyan
                        : SciFiTheme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.iconName,
                      selectedIcon === iconName && styles.iconNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {ICON_DISPLAY_NAMES[iconName] || iconName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={SciFiTheme.colors.neonCyan} />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
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
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: SciFiTheme.colors.borderDim,
    backgroundColor: SciFiTheme.colors.bgSecondary,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SciFiTheme.colors.textPrimary,
  },
  form: {
    flex: 1,
    padding: 20,
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: SciFiTheme.colors.textPrimary,
  },
  inputWrapper: {
    marginHorizontal: 2,
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderDim,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: SciFiTheme.colors.bgSecondary,
    color: SciFiTheme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: SciFiTheme.colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SciFiTheme.colors.neonCyan,
  },
  radioLabel: {
    fontSize: 16,
    color: SciFiTheme.colors.textPrimary,
  },
  iconGridContainer: {
    maxHeight: 400,
    marginTop: 8,
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderDim,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SciFiTheme.colors.bgSecondary,
    gap: 6,
  },
  selectedIconOption: {
    borderColor: SciFiTheme.colors.borderPrimary,
    backgroundColor: SciFiTheme.colors.bgTertiary,
    ...SciFiTheme.effects.glow,
  },
  iconName: {
    fontSize: 11,
    color: SciFiTheme.colors.textSecondary,
    textAlign: 'center',
  },
  iconNameSelected: {
    color: SciFiTheme.colors.neonCyan,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: SciFiTheme.colors.borderDim,
    backgroundColor: SciFiTheme.colors.bgSecondary,
    alignItems: 'flex-start',
  },
  createButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    ...SciFiTheme.effects.glow,
  },
  createButtonText: {
    color: SciFiTheme.colors.neonCyan,
    fontSize: 16,
    fontWeight: '600',
  },
});
