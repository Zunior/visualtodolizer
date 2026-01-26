# Visual Todo Lizer - Flutter Version

This is the Flutter/Dart version of the Visual Todo Lizer app, converted from React Native/Expo. It uses the same Firebase Firestore connection as the original app.

## Features

- Main screen with menu icon, root sidebar, and child list
- Drag-and-drop with cross-list support (simplified implementation)
- Firebase Firestore integration (same connection as React Native app)
- Text editor with link parsing (URLs and Windows paths)
- Folder view for recursive navigation
- Modals and context menus
- Sci-fi theme styling

## Setup

### Prerequisites

- Flutter SDK (3.0.0 or higher)
- Firebase project access (already configured)
- Android Studio / Xcode for mobile development

### Installation

**Note:** Flutter is installed at `C:\instalacije\flutter\flutter`

#### Quick Setup (Windows)

1. Run the setup script:
   ```bash
   setup.bat
   ```
   This will check your Flutter installation and install all dependencies.

#### Manual Setup

1. Navigate to the project directory:
   ```bash
   cd vtd_flutter_dart
   ```

2. Add Flutter to your PATH (or use full path):
   ```bash
   set PATH=C:\instalacije\flutter\flutter\bin;%PATH%
   ```

3. Install dependencies:
   ```bash
   C:\instalacije\flutter\flutter\bin\flutter pub get
   ```
   Or if Flutter is in your PATH:
   ```bash
   flutter pub get
   ```

3. For Android:
   - The `google-services.json` file is already configured in `android/app/`
   - Make sure your `android/app/build.gradle` includes:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```
   - And in `android/build.gradle`:
     ```gradle
     dependencies {
         classpath 'com.google.gms:google-services:4.4.0'
     }
     ```

4. For iOS:
   - The `GoogleService-Info.plist` file is already configured in `ios/Runner/`
   - Run `pod install` in the `ios/` directory

### Firebase Configuration

The app is already configured to use the same Firebase project as the React Native app:
- Project ID: `visualtodolizer`
- API Key: Already configured in `lib/main.dart`
- Firestore collection: `node` (same as React Native app)

## Running the App

**Note:** If Flutter is not in your PATH, use the full path: `C:\instalacije\flutter\flutter\bin\flutter`

#### Quick Run (Windows)

**For Web (Recommended for quick testing):**
```bash
# Chrome
run_web.bat

# Firefox
run_web_firefox.bat

# Quick run (Chrome, assumes web already enabled)
run_web_now.bat
```

**For Mobile:**
```bash
run.bat
```

#### Manual Run

### Web (Easiest - No device needed!)

**Quick method:**
```bash
run_web.bat
```

**Manual method:**
```bash
# Enable web support (first time only)
C:\instalacije\flutter\flutter\bin\flutter config --enable-web

# Run on Chrome
C:\instalacije\flutter\flutter\bin\flutter run -d chrome
```

**Or if Flutter is in your PATH:**
```bash
flutter config --enable-web
flutter run -d chrome
```

**Other browsers:**
```bash
# Firefox
C:\instalacije\flutter\flutter\bin\flutter run -d firefox

# Edge
C:\instalacije\flutter\flutter\bin\flutter run -d edge

# List all available devices/browsers
C:\instalacije\flutter\flutter\bin\flutter devices
```

### Android
```bash
C:\instalacije\flutter\flutter\bin\flutter run
```
Or if Flutter is in your PATH:
```bash
flutter run
```

### iOS
```bash
C:\instalacije\flutter\flutter\bin\flutter run
```

### Check Available Devices
```bash
C:\instalacije\flutter\flutter\bin\flutter devices
```

## Project Structure

```
vtd_flutter_dart/
├── lib/
│   ├── main.dart                 # App entry point with Firebase initialization
│   ├── models/
│   │   └── node.dart             # Node data model
│   ├── services/
│   │   └── firestore_service.dart  # Firestore operations
│   ├── theme/
│   │   └── scifi_theme.dart      # Sci-fi theme colors and styles
│   ├── screens/
│   │   └── main_screen.dart      # Main screen with state management
│   ├── widgets/
│   │   ├── menu_icon.dart
│   │   ├── root_node_sidebar.dart
│   │   ├── child_node_list.dart
│   │   ├── node_icon.dart
│   │   ├── folder_view.dart
│   │   ├── text_editor.dart
│   │   ├── create_node_modal.dart
│   │   ├── icon_change_modal.dart
│   │   ├── node_context_menu.dart
│   │   └── lucide_icon.dart
│   └── utils/
│       └── link_parser.dart      # Link parsing utility
├── android/
│   └── app/
│       └── google-services.json  # Firebase Android config
├── ios/
│   └── Runner/
│       └── GoogleService-Info.plist  # Firebase iOS config
└── pubspec.yaml
```

## Differences from React Native Version

1. **Drag-and-Drop**: Simplified implementation using Flutter's built-in widgets. Full cross-list drag-and-drop may require additional implementation.

2. **State Management**: Uses `setState` as requested, instead of a state management library.

3. **Icons**: Uses `lucide_icons` package. The icon mapping in `LucideIcon` widget may need expansion for all available icons.

4. **Navigation**: Uses inline content rendering instead of navigation stack (same behavior as React Native version).

## Notes

- The app connects to the same Firestore database as the React Native app
- All data is shared between both apps
- The same collection (`node`) and data structure are used
- Parent normalization (empty string for root) is maintained

## Troubleshooting

1. **Firebase connection issues**: Verify that the Firebase configuration files are in place and the API key is correct.

2. **Icon not found**: Some Lucide icons may not be available. The app falls back to a circle icon.

3. **Build errors**: Make sure all dependencies are installed with `flutter pub get`.

4. **Android build**: Ensure Google Services plugin is properly configured in `build.gradle` files.
