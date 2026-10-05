import 'package:get/get.dart';
import '../../presentation/screens/exception/exception_screen.dart';

class GlobalExceptionHandler {
  static bool isShowingException = false;

  static void showExceptionScreen() {
    if (!isShowingException) {
      isShowingException = true;
      Get.to(
        () => const ExceptionScreen(),
        fullscreenDialog: true,
        transition: Transition.fadeIn,
        opaque: false,
      );
    }
  }

  static void hideExceptionScreen() {
    if (isShowingException) {
      isShowingException = false;
      Get.back();
    }
  }
}
