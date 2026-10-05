import 'package:get/get.dart';
import 'package:logger/logger.dart';
import '../../data/models/address_model.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import 'base_controller.dart';

class AddressController extends BaseController {
  final ApiClient apiClient;
  AddressController({required this.apiClient});

  final addresses = <AddressModel>[].obs;
  final selectedAddress = Rxn<AddressModel>();
  final isLoadingList = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchAddresses();
  }

  Future<void> fetchAddresses() async {
    isLoadingList.value = true;
    try {
      final response = await apiClient.getData(ApiEndpoints.address);
      if (response.data['status'] == 'success') {
        final list = (response.data['data'] as List)
            .map((e) => AddressModel.fromJson(e))
            .toList();
        addresses.assignAll(list);
        
        // Auto-select default address if none selected
        if (selectedAddress.value == null && addresses.isNotEmpty) {
          selectedAddress.value = addresses.firstWhere(
            (a) => a.isDefault, 
            orElse: () => addresses.first
          );
        }
      }
    } catch (e) {
      Logger().e('Fetch Addresses Error: $e');
    } finally {
      isLoadingList.value = false;
    }
  }

  Future<bool> addAddress(AddressModel address) async {
    if (addresses.length >= 3) {
      showError('You can only add up to 3 addresses');
      return false;
    }
    showLoading();
    try {
      final response = await apiClient.postData(ApiEndpoints.address, address.toJson());
      if (response.data['status'] == 'success') {
        await fetchAddresses();
        Get.back();
        Get.snackbar('Success', 'Address added successfully');
        return true;
      }
      return false;
    } catch (e) {
      showError('Failed to add address');
      return false;
    } finally {
      hideLoading();
    }
  }

  Future<bool> updateAddress(AddressModel address) async {
    showLoading();
    try {
      final response = await apiClient.putData(ApiEndpoints.address, address.toJson());
      if (response.data['status'] == 'success') {
        await fetchAddresses();
        Get.back();
        Get.snackbar('Success', 'Address updated successfully');
        return true;
      }
      return false;
    } catch (e) {
      showError('Failed to update address');
      return false;
    } finally {
      hideLoading();
    }
  }

  Future<void> deleteAddress(int id) async {
    showLoading();
    try {
      final response = await apiClient.deleteData('${ApiEndpoints.address}?id=$id');
      if (response.data['status'] == 'success') {
        addresses.removeWhere((a) => a.id == id);
        if (selectedAddress.value?.id == id) {
          selectedAddress.value = addresses.isNotEmpty ? addresses.first : null;
        }
        Get.snackbar('Deleted', 'Address removed');
      }
    } catch (e) {
      showError('Failed to delete address');
    } finally {
      hideLoading();
    }
  }

  void selectAddress(AddressModel address) {
    selectedAddress.value = address;
  }
}
