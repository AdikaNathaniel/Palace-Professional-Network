import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

/// Four individual boxes for PIN entry instead of one plain text field.
/// Keeps [controller].text in sync with the combined digits, so existing
/// Form validation/submission code that reads the controller keeps working
/// unchanged.
class PinBoxesField extends StatefulWidget {
  final TextEditingController controller;
  final int length;
  final ValueChanged<String>? onChanged;

  const PinBoxesField({
    super.key,
    required this.controller,
    this.length = 4,
    this.onChanged,
  });

  @override
  State<PinBoxesField> createState() => _PinBoxesFieldState();
}

class _PinBoxesFieldState extends State<PinBoxesField> {
  late final List<TextEditingController> _boxControllers;
  late final List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    final existing = widget.controller.text.split('');
    _boxControllers = List.generate(
      widget.length,
      (i) => TextEditingController(text: i < existing.length ? existing[i] : ''),
    );
    _focusNodes = List.generate(widget.length, (_) => FocusNode());
  }

  @override
  void dispose() {
    for (final c in _boxControllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _syncValue() {
    final combined = _boxControllers.map((c) => c.text).join();
    widget.controller.text = combined;
    widget.onChanged?.call(combined);
  }

  void _onBoxChanged(int index, String value) {
    if (value.length > 1) {
      // Handles a paste landing in one box.
      final chars = value.split('');
      for (var i = 0; i < chars.length && index + i < widget.length; i++) {
        _boxControllers[index + i].text = chars[i];
      }
      final nextIndex = (index + chars.length).clamp(0, widget.length - 1);
      _focusNodes[nextIndex].requestFocus();
    } else if (value.isNotEmpty && index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    }
    _syncValue();
    setState(() {});
  }

  void _handleKey(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _boxControllers[index].text.isEmpty &&
        index > 0) {
      _boxControllers[index - 1].clear();
      _focusNodes[index - 1].requestFocus();
      _syncValue();
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(widget.length, (index) {
        return Padding(
          padding: EdgeInsets.only(right: index == widget.length - 1 ? 0 : 12),
          child: KeyboardListener(
            focusNode: FocusNode(skipTraversal: true),
            onKeyEvent: (event) => _handleKey(index, event),
            child: SizedBox(
              width: 52,
              height: 56,
              child: TextField(
                controller: _boxControllers[index],
                focusNode: _focusNodes[index],
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                obscureText: true,
                obscuringCharacter: '•',
                maxLength: 1,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  counterText: '',
                  contentPadding: EdgeInsets.zero,
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.fieldBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.fieldBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.violet, width: 2),
                  ),
                ),
                onChanged: (v) => _onBoxChanged(index, v),
              ),
            ),
          ),
        );
      }),
    );
  }
}

/// Wraps [PinBoxesField] in a [FormField] so it participates in the
/// surrounding Form's validate()/error-text display like any other field.
class PinBoxesFormField extends FormField<String> {
  PinBoxesFormField({
    super.key,
    required TextEditingController controller,
    super.validator,
    int length = 4,
  }) : super(
          initialValue: controller.text,
          builder: (state) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                PinBoxesField(
                  controller: controller,
                  length: length,
                  onChanged: (v) => state.didChange(v),
                ),
                if (state.hasError)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      state.errorText!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.danger, fontSize: 12),
                    ),
                  ),
              ],
            );
          },
        );
}
