import { useLocalSearchParams } from 'expo-router';
import FolderView from '@/components/FolderView';

export default function FolderPage() {
  const { id } = useLocalSearchParams();
  const folderId = Array.isArray(id) ? id[0] : id || '';

  return <FolderView parentId={folderId} />;
}
