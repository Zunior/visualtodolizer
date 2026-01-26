import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'screens/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: 'AIzaSyARnL8-ra0o5JbqVlrkb7cd6s8w_wuwmNk',
      appId: '1:896237748850:web:c81a7d7106eea2ba2238eb',
      messagingSenderId: '896237748850',
      projectId: 'visualtodolizer',
      authDomain: 'visualtodolizer.firebaseapp.com',
      storageBucket: 'visualtodolizer.firebasestorage.app',
    ),
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Visual Todo Lizer',
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.cyan,
      ),
      home: const MainScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
