import FolderView from '@/components/FolderView';
import pb, { Node } from '@/lib/pocketbase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, useColorScheme } from 'react-native';

export default function FolderPage() {
    const { id } = useLocalSearchParams();
    const folderId = Array.isArray(id) ? id[0] : id;
    const [currentNode, setCurrentNode] = useState<Node | null>(null);
    const theme = useColorScheme();
    const iconColor = theme === 'dark' ? 'white' : 'black';

    useEffect(() => {
        if (folderId && folderId !== 'root') {
            pb.collection('nodes').getOne<Node>(folderId)
                .then(setCurrentNode)
                .catch(e => {
                    console.error("Error fetching node info:", e);
                    setCurrentNode(null);
                });
        } else {
            setCurrentNode(null);
        }
    }, [folderId]);

    const handleBack = () => {
        const targetPath = (currentNode && currentNode.parent)
            ? `/folder/${currentNode.parent}`
            : '/folder/root';

        if (router.canGoBack()) {
            // If we are just going back up 1 level and history matches, simple back works?
            // But user said "not browsing history".
            // So safe bet:
            // If target is root, we likely want to reset/pop to top.
            if (targetPath === '/folder/root') {
                // router.dismissTo is not standard Expo Router API? 
                // router.navigate *should* work if 'root' is unique in stack.
                // Let's use replace to avoid building stack.
                router.replace(targetPath as any);
            } else {
                router.replace(targetPath as any);
            }
        } else {
            router.replace(targetPath as any);
        }
        // Using replace ensures we don't keep adding to stack, 
        // effectively making "Back" a hierarchical jump that resets the current view level.
    };

    return (
        <View style={{ flex: 1 }}>
            <Stack.Screen
                options={{
                    title: currentNode?.title || (folderId === 'root' ? 'Home' : 'Folder'),
                    headerBackVisible: folderId === 'root' ? false : undefined,
                    headerLeft: folderId !== 'root' ? () => (
                        <TouchableOpacity onPress={handleBack} style={{ marginRight: 10 }}>
                            <Ionicons name="arrow-back" size={24} color={iconColor} />
                        </TouchableOpacity>
                    ) : undefined
                }}
            />
            <FolderView parentId={folderId || 'root'} />
        </View>
    );
}
