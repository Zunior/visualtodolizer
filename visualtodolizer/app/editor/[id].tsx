import TextEditor from '@/components/TextEditor';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function EditorPage() {
    const { id } = useLocalSearchParams();
    const nodeId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();
    const navigation = useNavigation();

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            router.push('/folder/root');
        }
    };

    if (!nodeId) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-red-500">Error: No ID</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Stack.Screen 
                options={{ 
                    title: 'Edit Text', 
                    headerShown: true,
                    headerBackVisible: true,
                    headerBackTitleVisible: false,
                    headerLeft: () => (
                        <Pressable
                            onPress={handleBack}
                            style={{ marginLeft: 10, padding: 8 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#007AFF" />
                        </Pressable>
                    ),
                }} 
            />
            <TextEditor nodeId={nodeId} />
        </View>
    );
}
