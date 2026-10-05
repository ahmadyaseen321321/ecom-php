import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ecomapp/core/theme/app_theme.dart';
import 'package:ecomapp/presentation/controllers/support_controller.dart';
import 'chat_screen.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final SupportController controller = Get.put(
      SupportController(apiClient: Get.find()),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Support Tickets',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading && controller.tickets.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.tickets.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.support_agent, size: 80, color: Colors.grey[300]),
                const SizedBox(height: 16),
                const Text(
                  'No support tickets yet',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: controller.tickets.length,
          itemBuilder: (context, index) {
            final ticket = controller.tickets[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: ListTile(
                onTap: () => Get.to(() => ChatScreen(ticket: ticket)),
                title: Text(
                  ticket.subject,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  'Status: ${ticket.status.toUpperCase()}',
                  style: TextStyle(
                    color: ticket.status == 'open' ? Colors.green : Colors.red,
                  ),
                ),
                trailing: const Icon(Icons.chevron_right),
              ),
            );
          },
        );
      }),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateTicketDialog(context, controller),
        label: const Text('New Ticket'),
        icon: const Icon(Icons.add),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  void _showCreateTicketDialog(
    BuildContext context,
    SupportController controller,
  ) {
    final TextEditingController subjectController = TextEditingController();
    Get.dialog(
      AlertDialog(
        title: const Text('Create New Ticket'),
        content: TextField(
          controller: subjectController,
          decoration: const InputDecoration(hintText: 'Enter subject'),
        ),
        actions: [
          TextButton(onPressed: () => Get.back(), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (subjectController.text.isNotEmpty) {
                controller.createTicket(subjectController.text);
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}
