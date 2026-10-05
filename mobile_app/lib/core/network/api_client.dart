import 'dart:io';
import 'package:dio/dio.dart';
import 'package:get/get.dart' as getx;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_endpoints.dart';
import 'global_exception_handler.dart';

class ApiClient extends getx.GetxService {
  late Dio dio;
  final String appBaseUrl = ApiEndpoints.baseUrl;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: appBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        responseType: ResponseType.json,
      ),
    );

    // Interceptor for Authorization
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          getx.Get.log('DIO ERROR: ${e.message}');
          getx.Get.log('DIO ERROR BODY: ${e.response?.data}');
          getx.Get.log('DIO ERROR TYPE: ${e.type}');
          if (e.response?.statusCode != null) {
            getx.Get.log('DIO ERROR STATUS: ${e.response?.statusCode}');
          }
          if (e.response?.statusCode == 401) {
            // Handle Logout or Token Refresh
          }

          if (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              (e.type == DioExceptionType.unknown &&
                  e.error is SocketException)) {
            GlobalExceptionHandler.showExceptionScreen();
          }

          return handler.next(e);
        },
        onResponse: (response, handler) {
          final code = response.statusCode ?? 0;
          final raw = response.data;
          final isEmpty = raw == null || (raw is String && raw.trim().isEmpty);

          // PUT/PATCH often return 204 or 200 with no body; Dio then gives null/empty data.
          if (isEmpty) {
            if (code >= 200 && code < 300) {
              response.data = <String, dynamic>{
                'status': 'success',
                'message': 'OK',
              };
            } else {
              response.data = <String, dynamic>{
                'status': 'error',
                'message': code == 405
                    ? 'Server blocked this method (e.g. PUT disabled). Check hosting / .htaccess.'
                    : 'Empty server response (HTTP $code)',
              };
            }
          } else if (raw is String) {
            response.data = <String, dynamic>{
              'status': 'error',
              'message': 'Invalid server response (HTML/Text)',
            };
          }
          return handler.next(response);
        },
      ),
    );
  }

  Future<Response> getData(String uri, {Map<String, dynamic>? query}) async {
    try {
      return await dio.get(uri, queryParameters: query);
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> postData(String uri, dynamic data) async {
    try {
      if (data is FormData) {
        return await dio.post(uri, data: data);
      }
      return await dio.post(
        uri,
        data: data,
        options: Options(contentType: Headers.jsonContentType),
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> putData(String uri, dynamic data) async {
    try {
      if (data is FormData) {
        return await dio.put(uri, data: data);
      }
      return await dio.put(
        uri,
        data: data,
        options: Options(contentType: Headers.jsonContentType),
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<Response> deleteData(String uri) async {
    try {
      return await dio.delete(uri);
    } catch (e) {
      rethrow;
    }
  }
}
