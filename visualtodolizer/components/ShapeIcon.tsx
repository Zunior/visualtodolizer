import React from 'react';
import { View } from 'react-native';

export type ShapeType = 'circle' | 'square' | 'hexagon';

interface ShapeIconProps {
    shape?: ShapeType;
    color?: string;
    size?: number;
}

export default function ShapeIcon({ shape = 'square', color = '#3b82f6', size = 40 }: ShapeIconProps) {
    const commonStyle = {
        width: size,
        height: size,
        backgroundColor: color,
    };

    if (shape === 'circle') {
        return <View style={[commonStyle, { borderRadius: size / 2 }]} />;
    }

    if (shape === 'hexagon') {
        // Simple hexagon approximation using a view and rotation or just a different style.
        // For now, let's use a standard View with some styling, or maybe valid SVG if we had it installed.
        // Since we want to keep it simple without extra deps if possible (though we have expo-image).
        // A rotated square clipped?
        // Let's standard "square" with some border radius for now, or maybe just a unicode character?
        // Let's stick to View manipulation.
        // Or we can use `expo-symbols` if available on iOS, but we need web.
        // Let's use a poly-point clip-path if on web, but Native doesn't support clip-path easily.
        // Fallback: A square with border radius 8 for now, maybe distinguish later.
        // Actually, let's just use a square for hexagon placeholder to avoid complexity.
        // Correction: User asked for "Icons should change shape".
        // Let's try to make a CSS hexagon with NativeWind? :D 
        // Or just a View with `transform: [{ rotate: '45deg' }]` for a diamond, close enough to unique.
        return (
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <View style={[commonStyle, { transform: [{ rotate: '45deg' }], borderRadius: 4 }]} />
            </View>
        );
    }

    // Square
    return <View style={[commonStyle, { borderRadius: 4 }]} />;
}
