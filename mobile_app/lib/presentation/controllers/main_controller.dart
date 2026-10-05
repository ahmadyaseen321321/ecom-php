import 'package:get/get.dart';

/// Bottom navigation index for [MainScreen]. Registered in [InitialBinding].
class MainController extends GetxController {
  final _currentIndex = 0.obs;
  int get currentIndex => _currentIndex.value;
  void changeIndex(int index) => _currentIndex.value = index;
}
