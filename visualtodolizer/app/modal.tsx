import LucideIcon from '@/components/LucideIcon';
import { SciFiTheme } from '@/constants/scifiTheme';
import pb from '@/lib/pocketbase';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  'help-circle', // FAQ/help icon
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
  'folder-kanban': 'general',
  'briefcase': 'project',
};

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parentId = typeof params.parentId === 'string' ? params.parentId : '';

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
      await pb.collection('nodes').create({
        title,
        type,
        parent: parentId === 'root' ? '' : parentId,
        style: {
          icon: selectedIcon,
          x: 0, // Default to 0,0 for now as per plan
          y: 0
        }
      });
      router.dismiss();
    } catch (e: any) {
      console.error('Error creating node:', e);
      Alert.alert('Error', e.message || 'Failed to create node');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'New Node',
          headerStyle: {
            backgroundColor: SciFiTheme.colors.bgSecondary,
            borderBottomWidth: 1,
            borderBottomColor: SciFiTheme.colors.borderDim,
            elevation: 0,
          },
          headerTintColor: SciFiTheme.colors.neonCyan,
          headerTitleStyle: {
            color: SciFiTheme.colors.textPrimary,
            fontWeight: '700',
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.dismiss()} 
              style={{ 
                marginLeft: 10, 
                padding: 8,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: SciFiTheme.colors.borderDim,
                backgroundColor: SciFiTheme.colors.bgTertiary,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={SciFiTheme.colors.neonCyan} />
            </TouchableOpacity>
          ),
        }}
      />
      <Text style={styles.headerTitle}>Create New Node</Text>

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
            autoFocus
          />
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.radioContainer}>
          {['panel', 'text'].map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.radioOption}
              onPress={() => setType(t as any)}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SciFiTheme.colors.bgPrimary,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
    color: SciFiTheme.colors.textPrimary,
  },
  form: {
    flex: 1,
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
    outlineStyle: 'none',
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
    marginTop: 20,
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
