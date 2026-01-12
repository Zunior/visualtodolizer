import LucideIcon from '@/components/LucideIcon';
import { ICON_GROUPS, getIconsForGroupAndType } from '@/constants/iconGroups';
import pb from '@/lib/pocketbase';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parentId = typeof params.parentId === 'string' ? params.parentId : '';

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'panel' | 'text'>('panel');
  const [selectedGroup, setSelectedGroup] = useState(ICON_GROUPS[0].id);
  const [selectedIcon, setSelectedIcon] = useState<string>(() => {
    // Initialize with first available icon
    const initialIcons = getIconsForGroupAndType(ICON_GROUPS[0].id, 'panel');
    return initialIcons.length > 0 ? initialIcons[0] : '';
  });
  const [loading, setLoading] = useState(false);

  // Update selected icon when group or type changes
  useEffect(() => {
    const icons = getIconsForGroupAndType(selectedGroup, type);
    if (icons.length > 0) {
      // Always set to first icon when group or type changes
      setSelectedIcon(icons[0]);
    } else {
      setSelectedIcon('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, type]);

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
          iconGroup: selectedGroup,
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

  const availableIcons = getIconsForGroupAndType(selectedGroup, type);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Modal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.dismiss()} style={{ marginLeft: 10, padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#334155" />
            </TouchableOpacity>
          ),
        }}
      />
      <Text style={styles.headerTitle}>Create New Node</Text>

        <ScrollView style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={[styles.input, { width: SCREEN_WIDTH * 0.5 }]}
          placeholder="Enter title..."
          value={title}
          onChangeText={setTitle}
          multiline
          autoFocus
        />

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
        <View style={styles.iconSelectionContainer}>
          {/* Left side: Icon groups list */}
          <ScrollView style={styles.groupList} showsVerticalScrollIndicator={false}>
            {ICON_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupListItem,
                  selectedGroup === group.id && styles.groupListItemSelected
                ]}
                onPress={() => setSelectedGroup(group.id)}
              >
                <Text
                  style={[
                    styles.groupListText,
                    selectedGroup === group.id && styles.groupListTextSelected
                  ]}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Right side: Icons vertical list */}
          <ScrollView style={styles.iconsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.iconList}>
              {availableIcons.map((iconName) => (
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
                    color={selectedIcon === iconName ? '#3b82f6' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.iconName,
                      selectedIcon === iconName && styles.iconNameSelected
                    ]}
                    numberOfLines={1}
                  >
                    {iconName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
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
    backgroundColor: '#fff',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
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
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  radioLabel: {
    fontSize: 16,
    color: '#334155',
  },
  iconSelectionContainer: {
    flexDirection: 'row',
    height: 300,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  groupList: {
    alignSelf: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingRight: 12,
    minWidth: 150,
  },
  groupListItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    alignSelf: 'flex-start',
  },
  groupListItemSelected: {
    backgroundColor: '#3b82f6',
  },
  groupListText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    flexShrink: 0,
  },
  groupListTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  iconsContainer: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    minWidth: 150,
  },
  iconList: {
    flexDirection: 'column',
    gap: 8,
  },
  iconOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 12,
    alignSelf: 'flex-start',
  },
  selectedIconOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  iconName: {
    fontSize: 14,
    color: '#64748b',
    flexShrink: 0,
  },
  iconNameSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
