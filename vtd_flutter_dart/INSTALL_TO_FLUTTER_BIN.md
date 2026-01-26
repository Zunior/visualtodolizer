# Running from Flutter Bin Directory

If you want to run Flutter commands from `C:\instalacije\flutter\flutter\bin\`, you have a few options:

## Quick Method (Recommended)

Just change to the project directory first:

```cmd
cd C:\ExelaPlexus\VTD_full_stack\vtd_flutter_dart
C:\instalacije\flutter\flutter\bin\flutter pub get
C:\instalacije\flutter\flutter\bin\flutter run -d firefox
```

## Alternative: Copy Helper Scripts

1. Copy these files to `C:\instalacije\flutter\flutter\bin\`:
   - `vtd_pub_get.bat` (for `flutter pub get`)
   - `vtd_run_firefox.bat` (for `flutter run -d firefox`)
   - `vtd_run_chrome.bat` (for `flutter run -d chrome`)

2. Then from Flutter bin directory, run:
   ```cmd
   vtd_pub_get.bat
   vtd_run_firefox.bat
   ```

## Why Project Directory Matters

Flutter commands like `pub get` and `run` look for `pubspec.yaml` in the current directory. They need to be run from the project root where `pubspec.yaml` exists.
