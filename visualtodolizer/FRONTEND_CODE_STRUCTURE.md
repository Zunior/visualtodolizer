# Frontend Code Structure Documentation

## Project Overview

**Project Name:** VisualTodoLizer  
**Type:** Recursive Panel App  
**Platforms:** Windows (Web), Android, iOS  
**Tech Stack:** Expo (React Native Web), PocketBase, NativeWind (Tailwind), TypeScript

## Architecture

- **Framework:** Expo Router (file-based routing)
- **UI Library:** React Native with React Native Web for cross-platform support
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Backend:** PocketBase (REST API at `http://127.0.0.1:8090`)
- **State Management:** React Hooks (useState, useEffect)
- **Navigation:** Expo Router Stack Navigation
- **Animations:** React Native Reanimated + Gesture Handler

## Directory Structure

```
visualtodolizer/
├── app/                          # Expo Router pages (file-based routing)
│   ├── _layout.tsx              # Root layout with navigation stack
│   ├── index.tsx                # Entry point (redirects to /folder/root)
│   ├── folder/
│   │   └── [id].tsx            # Dynamic folder view page
│   ├── editor/
│   │   └── [id].tsx            # Dynamic text editor page
│   └── modal.tsx                # Modal screen (optional)
│
├── components/                   # Reusable React components
│   ├── FolderView.tsx          # Core recursive folder component
│   ├── DraggableNode.tsx       # Draggable node with gestures
│   ├── TextEditor.tsx          # Full-screen text editor
│   ├── ShapeIcon.tsx           # Shape rendering (circle/square/hexagon)
│   ├── themed-text.tsx         # Themed text component
│   ├── themed-view.tsx         # Themed view component
│   ├── hello-wave.tsx          # Example component
│   ├── external-link.tsx       # External link component
│   ├── haptic-tab.tsx          # Haptic feedback tab
│   ├── parallax-scroll-view.tsx # Parallax scroll component
│   └── ui/                     # UI primitives
│       ├── collapsible.tsx
│       ├── icon-symbol.tsx
│       └── icon-symbol.ios.tsx
│
├── lib/                         # Core libraries and utilities
│   └── pocketbase.ts           # PocketBase client configuration
│
├── hooks/                       # Custom React hooks
│   ├── use-color-scheme.ts     # Color scheme detection
│   ├── use-color-scheme.web.ts # Web-specific color scheme
│   └── use-theme-color.ts      # Theme color hook
│
├── constants/                   # App constants
│   └── theme.ts                # Theme colors and fonts
│
├── assets/                      # Static assets
│   └── images/                 # App icons and images
│
├── scripts/                     # Utility scripts
│   ├── reset-project.js
│   └── seed.mjs                # Database seeding script
│
├── global.css                   # Global Tailwind styles
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── app.json                    # Expo configuration
└── package.json                # Dependencies and scripts
```

## Core Components

### 1. FolderView (`components/FolderView.tsx`)
**Purpose:** Recursive folder/panel view component that displays child nodes

**Key Features:**
- Fetches nodes from PocketBase where `parent` matches current ID (or empty for root)
- Displays nodes in a draggable canvas
- Handles navigation: panels → push new FolderView, text → open TextEditor
- Pull-to-refresh functionality
- Responsive canvas height

**Props:**
```typescript
interface FolderViewProps {
    parentId: string;  // 'root' for root level, or node ID
}
```

**State:**
- `nodes`: Array of Node objects
- `loading`: Loading state

**Key Functions:**
- `fetchNodes()`: Queries PocketBase with filter `parent = ""` or `parent = "{parentId}"`
- `updateNodePosition()`: Updates node position in DB after drag
- `handlePress()`: Routes to folder or editor based on node type

---

### 2. DraggableNode (`components/DraggableNode.tsx`)
**Purpose:** Individual draggable node with gesture handling

**Key Features:**
- Drag and drop using React Native Gesture Handler
- Double-tap to open (panel/text)
- Animated scaling on drag
- Position persistence to database
- Uses ShapeIcon for visual representation

**Props:**
```typescript
interface DraggableNodeProps {
    node: Node;
    onDragEnd: (id: string, x: number, y: number) => void;
    onPress: (node: Node) => void;
}
```

**Gestures:**
- `Pan`: Drag gesture for moving nodes
- `Tap` (double): Opens node content
- `Race`: Composes gestures (drag vs double-tap)

**Styling:**
- Fixed size: 128x128 (w-32 h-32)
- White/dark gray background
- Shadow and rounded corners
- Absolute positioning based on x/y coordinates

---

### 3. TextEditor (`components/TextEditor.tsx`)
**Purpose:** Full-screen text editing component

**Key Features:**
- Multiline text input
- Auto-save to PocketBase
- Dark mode support
- Save button with loading state

**Props:**
```typescript
interface TextEditorProps {
    nodeId: string;
    initialContent?: string;
}
```

**State:**
- `content`: Text content
- `saving`: Save operation state

---

### 4. ShapeIcon (`components/ShapeIcon.tsx`)
**Purpose:** Renders different shapes based on node style

**Supported Shapes:**
- `circle`: Circular icon (borderRadius = size/2)
- `square`: Square with rounded corners (borderRadius: 4)
- `hexagon`: Rotated square (45deg) as hexagon approximation

**Props:**
```typescript
interface ShapeIconProps {
    shape?: 'circle' | 'square' | 'hexagon';
    color?: string;  // Default: '#3b82f6'
    size?: number;   // Default: 40
}
```

---

## Routing & Navigation

### Route Structure
```
/ (index.tsx)
  └── Redirects to /folder/root

/folder/[id] (folder/[id].tsx)
  └── Displays FolderView for given folder ID
  └── Supports "root" as special ID for root level

/editor/[id] (editor/[id].tsx)
  └── Displays TextEditor for text nodes

/modal (modal.tsx)
  └── Optional modal screen
```

### Navigation Stack (`app/_layout.tsx`)
- Uses Expo Router Stack navigation
- Theme provider (Dark/Light mode)
- Gesture handler root view wrapper
- Status bar configuration

**Stack Screens:**
- `index`: No header
- `folder/[id]`: Title "Folder" or "Home" for root
- `editor/[id]`: Title "Edit Text"
- `modal`: Modal presentation

---

## Data Layer

### PocketBase Client (`lib/pocketbase.ts`)
**Endpoint:** `http://127.0.0.1:8090`

**Node Interface:**
```typescript
interface Node {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  title: string;
  type: 'panel' | 'text';
  parent: string;  // Relation to another Node (empty string for root)
  content?: string;  // For text nodes
  style?: {
    shape?: 'circle' | 'square' | 'hexagon';
    color?: string;
    x?: number;  // Position coordinates
    y?: number;
  };
}
```

**Collection:** `nodes`

### Database Schema Configuration

The `nodes` collection in PocketBase has the following field configuration:

| Field Name | Type | Configuration |
|------------|------|---------------|
| `title` | Plain text | Standard text field for node title |
| `type` | Select | Options: `panel` or `text` |
| `parent` | Relation | Points to the `nodes` collection itself (self-referential). Allows single selection only. Empty string represents root level nodes. |
| `content` | Plain text | Used for text nodes to store the text content |
| `style` | JSON | Stores style configuration object with properties: `shape` (circle/square/hexagon), `color` (string), `x` (number), `y` (number) |

**Note:** PocketBase automatically adds system fields: `id`, `collectionId`, `collectionName`, `created`, `updated`.

**Common Queries:**
- Root nodes: `filter: 'parent = ""'`
- Child nodes: `filter: 'parent = "{parentId}"'`
- Sort: `-created` (newest first)

---

## Styling System

### NativeWind (Tailwind CSS)
**Config:** `tailwind.config.js`
- Content paths: `./app/**/*.{js,jsx,ts,tsx}`, `./components/**/*.{js,jsx,ts,tsx}`
- Uses NativeWind preset

### Global Styles
- `global.css`: Imported in `_layout.tsx`
- Dark mode: `dark:` prefix classes
- Responsive: Uses Tailwind responsive utilities

### Theme Constants (`constants/theme.ts`)
- Light/Dark color definitions
- Platform-specific fonts (iOS, Web, default)
- Tint colors for navigation

### Common Styling Patterns
- Background: `bg-gray-100 dark:bg-gray-900`
- Text: `text-gray-800 dark:text-gray-200`
- Cards: `bg-white dark:bg-gray-800 rounded-xl shadow-sm`

---

## Key Features

### 1. Recursive Panel Navigation
- Each panel can contain child panels (recursive)
- Navigation stack allows back button on every sub-panel
- Root level uses special ID "root"

### 2. Node Types
- **Panel:** Opens new FolderView (recursive)
- **Text:** Opens full-screen TextEditor

### 3. Drag & Drop
- Nodes are draggable on canvas
- Position persisted to database (x, y coordinates)
- Visual feedback (scale on drag)

### 4. Responsive Design
- Mobile: 2 columns (implied by node size)
- Desktop: 4-6 columns (flexible grid via absolute positioning)
- Canvas adapts to screen height

### 5. Shape Icons
- Dynamic shapes based on `style.shape` field
- Supports circle, square, hexagon
- Customizable color via `style.color`

### 6. Dark Mode
- System-aware color scheme
- Theme provider in root layout
- All components support dark mode classes

---

## Dependencies

### Core
- `expo`: ~54.0.30
- `expo-router`: ~6.0.21
- `react`: 19.1.0
- `react-native`: 0.81.5
- `react-native-web`: ~0.21.0

### Styling
- `nativewind`: ^4.2.1
- `tailwindcss`: ^4.1.18
- `react-native-css-interop`: ^0.2.1

### Backend
- `pocketbase`: ^0.26.5

### Navigation & Gestures
- `@react-navigation/native`: ^7.1.8
- `react-native-gesture-handler`: ~2.28.0
- `react-native-reanimated`: ~4.1.1
- `react-native-screens`: ~4.16.0

### UI/UX
- `expo-haptics`: ~15.0.8
- `@expo/vector-icons`: ^15.0.3

---

## TypeScript Configuration

**Path Aliases:**
- `@/*` → `./*` (root directory)

**Strict Mode:** Enabled

**Includes:**
- All `.ts` and `.tsx` files
- Expo types
- NativeWind types

---

## Development Scripts

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint",
  "reset-project": "node ./scripts/reset-project.js"
}
```

---

## Data Flow

1. **Initial Load:**
   - `index.tsx` → Redirects to `/folder/root`
   - `folder/[id].tsx` → Renders `FolderView` with `parentId`
   - `FolderView` → Fetches nodes from PocketBase

2. **Node Interaction:**
   - **Panel Node:** Click → `router.push(/folder/{nodeId})` → New FolderView
   - **Text Node:** Click → `router.push(/editor/{nodeId})` → TextEditor

3. **Drag & Drop:**
   - User drags node → `DraggableNode` updates position
   - On drag end → `updateNodePosition()` → Saves to PocketBase

4. **Text Editing:**
   - User edits text → `TextEditor` updates state
   - Save button → Updates PocketBase → Content persisted

---

## Back Button Implementation

Back button is handled automatically by Expo Router Stack navigation:
- Each `folder/[id]` screen has a back button (except root)
- Stack navigation maintains history
- `router.back()` can be called programmatically

---

## Notes

- Root folder uses special ID "root" (not a real database ID)
- Nodes use absolute positioning (not grid layout)
- Hexagon shape is approximated with rotated square
- Canvas height is set to max(window height, 1000) for scrolling
- Pull-to-refresh available on FolderView
- Optimistic updates for drag position (updates UI before DB save)

---

## Future Enhancements (Potential)

- Grid layout for better organization
- Search functionality
- Node creation UI
- Context menu (right-click/long-press)
- Node deletion
- Better hexagon rendering (SVG)
- Multi-select and bulk operations
- Node linking/relationships visualization

