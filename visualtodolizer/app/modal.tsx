import ShapeIcon from '@/components/ShapeIcon';
import pb from '@/lib/pocketbase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Predefined colors for the picker
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b'];
const SHAPES = ['circle', 'square', 'hexagon'] as const;

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parentId = typeof params.parentId === 'string' ? params.parentId : '';

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'panel' | 'text'>('panel');
  const [color, setColor] = useState(COLORS[4]); // Default blue
  const [shape, setShape] = useState<'circle' | 'square' | 'hexagon'>('square');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setLoading(true);
    try {
      await pb.collection('nodes').create({
        title,
        type,
        parent: parentId === 'root' ? '' : parentId,
        style: {
          color,
          shape,
          x: 0, // Default to 0,0 for now as per plan
          y: 0
        }
      });
      router.back();
    } catch (e: any) {
      console.error('Error creating node:', e);
      Alert.alert('Error', e.message || 'Failed to create node');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Create New Node</Text>

      <ScrollView style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title..."
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          {['panel', 'text'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeButton, type === t && styles.typeButtonSelected]}
              onPress={() => setType(t as any)}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextSelected]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Shape</Text>
        <View style={styles.row}>
          {SHAPES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setShape(s)}
              style={[styles.shapeOption, shape === s && styles.selectedOption]}
            >
              <ShapeIcon shape={s} color={color} size={40} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                color === c && styles.selectedOption
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>


        <View style={styles.previewContainer}>
          <Text style={styles.label}>Preview</Text>
          <View style={styles.previewBox}>
            <ShapeIcon shape={shape} color={color} size={64} />
            <Text style={styles.previewText} numberOfLines={1}>{title || 'Title'}</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.createButtonText}>Create</Text>}
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
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeText: {
    fontSize: 16,
    color: '#64748b',
  },
  typeTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shapeOption: {
    padding: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  selectedOption: {
    borderColor: '#334155',
    borderWidth: 2,
  },
  previewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  previewBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 150,
    height: 150,
    justifyContent: 'center',
  },
  previewText: {
    marginTop: 10,
    fontWeight: '500',
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
