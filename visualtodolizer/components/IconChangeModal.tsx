import LucideIcon from '@/components/LucideIcon';
import { SciFiTheme } from '@/constants/scifiTheme';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Final list of available icons (same as create new node modal)
const AVAILABLE_ICONS = [
  'notepad-text',
  'list-todo',
  'link',
  'code-2',
  'book-open',
  'key',
  'scroll-text',
  'graduation-cap',
  'help-circle', // FAQ/help icon
  'lightbulb',
  'sliders-horizontal',
  'code-xml',
  'folder-kanban',
  'briefcase',
];

// Display names for icons (same as create new node modal)
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
  'folder-kanban': 'general',
  'briefcase': 'project',
};

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
  const [selectedIcon, setSelectedIcon] = useState(
    node.style?.icon || AVAILABLE_ICONS[0]
  );
  const [title, setTitle] = useState(node.title || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && node) {
      const currentIcon = node.style?.icon || '';
      // If current icon is in available icons, use it; otherwise use first available
      setSelectedIcon(AVAILABLE_ICONS.includes(currentIcon) ? currentIcon : AVAILABLE_ICONS[0]);
      setTitle(node.title || '');
    }
  }, [visible, node]);

  const handleSave = async () => {
    if (!selectedIcon) {
      Alert.alert('Error', 'Please select an icon');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setLoading(true);
    try {
      await pb.collection('nodes').update(node.id, {
        title: title.trim(),
        style: {
          ...node.style,
          icon: selectedIcon,
        },
      });
      onIconChanged();
      onClose();
    } catch (e: any) {
      console.error('Error updating icon and title:', e);
      Alert.alert('Error', e.message || 'Failed to update icon and title');
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
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={SciFiTheme.colors.neonCyan} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Icon</Text>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { width: SCREEN_WIDTH * 0.5 - 4 }]}
              placeholder="Enter title..."
              placeholderTextColor={SciFiTheme.colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              multiline
              {...(Platform.OS === 'web' && { outlineStyle: 'none' })}
            />
          </View>

          <Text style={styles.label}>Icon</Text>
          <ScrollView style={styles.iconGridContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconOption,
                    selectedIcon === iconName && styles.selectedIconOption
                  ]}
                  onPress={() => setSelectedIcon(iconName)}
                >
                  <LucideIcon
                    iconName={iconName}
                    size={32}
                    color={selectedIcon === iconName ? SciFiTheme.colors.neonCyan : SciFiTheme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.iconName,
                      selectedIcon === iconName && styles.iconNameSelected
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
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={SciFiTheme.colors.neonCyan} />
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
  saveButton: {
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
  saveButtonText: {
    color: SciFiTheme.colors.neonCyan,
    fontSize: 16,
    fontWeight: '600',
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
});
