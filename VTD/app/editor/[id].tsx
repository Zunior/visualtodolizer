import { useLocalSearchParams } from 'expo-router';
import TextEditor from '@/components/TextEditor';

export default function EditorPage() {
  const { id } = useLocalSearchParams();
  const nodeId = Array.isArray(id) ? id[0] : id || '';

  return <TextEditor nodeId={nodeId} />;
}
