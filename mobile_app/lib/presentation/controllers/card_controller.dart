import 'package:get/get.dart';
import 'package:logger/logger.dart';
import '../../data/models/card_model.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import 'base_controller.dart';

class CardController extends BaseController {
  final ApiClient apiClient;
  CardController({required this.apiClient});

  final cards = <CardModel>[].obs;
  final selectedCard = Rxn<CardModel>();
  final isLoadingList = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchCards();
  }

  Future<void> fetchCards() async {
    isLoadingList.value = true;
    try {
      final response = await apiClient.getData(ApiEndpoints.card);
      if (response.data['status'] == 'success') {
        final list = (response.data['data'] as List)
            .map((e) => CardModel.fromJson(e))
            .toList();
        cards.assignAll(list);
        
        if (selectedCard.value == null && cards.isNotEmpty) {
          selectedCard.value = cards.firstWhere(
            (c) => c.isDefault, 
            orElse: () => cards.first
          );
        }
      }
    } catch (e) {
      Logger().e('Fetch Cards Error: $e');
    } finally {
      isLoadingList.value = false;
    }
  }

  Future<bool> addCard(CardModel card) async {
    if (cards.length >= 3) {
      Get.snackbar('Limit Reached', 'You can only add up to 3 cards');
      return false;
    }
    showLoading();
    try {
      final response = await apiClient.postData(ApiEndpoints.card, card.toJson());
      if (response.data['status'] == 'success') {
        await fetchCards();
        Get.back();
        Get.snackbar('Success', 'Card added successfully');
        return true;
      }
      return false;
    } catch (e) {
      showError('Failed to add card');
      return false;
    } finally {
      hideLoading();
    }
  }

  Future<void> deleteCard(int id) async {
    showLoading();
    try {
      final response = await apiClient.deleteData('${ApiEndpoints.card}?id=$id');
      if (response.data['status'] == 'success') {
        cards.removeWhere((c) => c.id == id);
        if (selectedCard.value?.id == id) {
          selectedCard.value = cards.isNotEmpty ? cards.first : null;
        }
        Get.snackbar('Deleted', 'Card removed');
      }
    } catch (e) {
      showError('Failed to delete card');
    } finally {
      hideLoading();
    }
  }

  void selectCard(CardModel card) {
    selectedCard.value = card;
  }
}
