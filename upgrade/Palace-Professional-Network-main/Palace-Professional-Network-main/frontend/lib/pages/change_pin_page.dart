import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/pin_boxes_field.dart';

class ChangePinPage extends StatefulWidget {
  const ChangePinPage({super.key});

  @override
  State<ChangePinPage> createState() => _ChangePinPageState();
}

class _ChangePinPageState extends State<ChangePinPage> {
  final _formKey = GlobalKey<FormState>();
  final _currentPinController = TextEditingController();
  final _newPinController = TextEditingController();
  final _confirmPinController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _currentPinController.dispose();
    _newPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ApiService.changePin(
        currentPin: _currentPinController.text.trim(),
        newPin: _newPinController.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your PIN has been changed.')),
      );
      Navigator.of(context).pop();
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Something went wrong. Please try again.';
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Change PIN')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: Text(
                        _error!,
                        style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  const Text(
                    'Current PIN *',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  PinBoxesFormField(
                    controller: _currentPinController,
                    validator: (v) {
                      if (v == null || v.length != 4) return 'Enter your current 4-digit PIN';
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'New PIN *',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  PinBoxesFormField(
                    controller: _newPinController,
                    validator: (v) {
                      if (v == null || v.length != 4) return 'PIN must be exactly 4 digits';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Confirm New PIN *',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  PinBoxesFormField(
                    controller: _confirmPinController,
                    validator: (v) {
                      if (v == null || v.length != 4) return 'Please confirm your new PIN';
                      if (v != _newPinController.text) return 'PINs do not match';
                      return null;
                    },
                  ),
                  const SizedBox(height: 28),
                  ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Update PIN'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
