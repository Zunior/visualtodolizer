import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator, Text } from 'react-native';
import { Node, getChildNodes } from '@/lib/firestore';
import { SciFiTheme } from '@/constants/scifiTheme';
import NodeIcon from './NodeIcon';

interface FolderViewProps {
  parentId: string;
  onNodePress?: (node: Node) => void;
}

export default function FolderView({ parentId, onNodePress }: FolderViewProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNodes();
  }, [parentId]);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const childNodes = await getChildNodes(parentId);
      setNodes(childNodes);
    } catch (e) {
      console.error('Error fetching nodes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNodePress = (node: Node) => {
    if (onNodePress) {
      onNodePress(node);
    }
  };

  const handleNodeLongPress = (node: Node) => {
    // Long press could open context menu in the future
    // For now, just do nothing
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SciFiTheme.colors.neonCyan} />
      </View>
    );
  }

  if (nodes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No child nodes</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {nodes.map((node) => (
        <View key={node.id} style={styles.nodeWrapper}>
          <NodeIcon
            node={node}
            onPress={() => handleNodePress(node)}
            onLongPress={() => handleNodeLongPress(node)}
            size={128}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  emptyText: {
    fontSize: 16,
    color: SciFiTheme.colors.textSecondary,
  },
  contentContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  nodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
