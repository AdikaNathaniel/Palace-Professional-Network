import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/biodata.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/ipc_logo.dart';

class BiodataFormPage extends StatefulWidget {
  final VoidCallback? onSubmitted;

  const BiodataFormPage({super.key, this.onSubmitted});

  @override
  State<BiodataFormPage> createState() => _BiodataFormPageState();
}

class _BiodataFormPageState extends State<BiodataFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _placeOfWorkController = TextEditingController();

  String? _ageRange;
  String? _gender;
  String? _maritalStatus;
  String? _professionCategory;
  String? _professionSubCategory;
  XFile? _pickedImage;
  Uint8List? _pickedImageBytes;

  Future<BiodataOptions>? _optionsFuture;
  bool _submitting = false;

  static const String _businessCategoryKey = 'Businessmen and Women';

  @override
  void initState() {
    super.initState();
    _optionsFuture = ApiService.fetchOptions();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _placeOfWorkController.dispose();
    super.dispose();
  }

  bool get _needsSubCategory =>
      _professionCategory?.contains(_businessCategoryKey) ?? false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Take a photo'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;
    final image = await picker.pickImage(
      source: source,
      maxWidth: 1000,
      imageQuality: 85,
    );
    if (image != null) {
      final bytes = await image.readAsBytes();
      setState(() {
        _pickedImage = image;
        _pickedImageBytes = bytes;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_ageRange == null || _gender == null || _maritalStatus == null ||
        _professionCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete all required fields.')),
      );
      return;
    }
    if (_needsSubCategory && _professionSubCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a specific trade/business type.')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await ApiService.submit(
        fullName: _fullNameController.text.trim(),
        ageRange: _ageRange!,
        gender: _gender!,
        maritalStatus: _maritalStatus!,
        email: _emailController.text,
        phoneNumber: _phoneController.text.trim(),
        professionCategory: _professionCategory!,
        professionSubCategory: _professionSubCategory,
        placeOfWork: _placeOfWorkController.text.trim(),
        imageFile: _pickedImage,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Biodata submitted successfully. Thank you!')),
      );
      _resetForm();
      widget.onSubmitted?.call();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _resetForm() {
    _formKey.currentState?.reset();
    _fullNameController.clear();
    _emailController.clear();
    _phoneController.clear();
    _placeOfWorkController.clear();
    setState(() {
      _ageRange = null;
      _gender = null;
      _maritalStatus = null;
      _professionCategory = null;
      _professionSubCategory = null;
      _pickedImage = null;
      _pickedImageBytes = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Palace Professional Network')),
      body: FutureBuilder<BiodataOptions>(
        future: _optionsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _ErrorState(
              message: snapshot.error.toString(),
              onRetry: () => setState(() {
                _optionsFuture = ApiService.fetchOptions();
              }),
            );
          }
          final options = snapshot.data!;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Center(child: IpcLogo()),
                  const SizedBox(height: 12),
                  const Text(
                    'International Palace Church',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.violetDark,
                    ),
                  ),
                  const Text(
                    'Professional Network Biodata Form',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 24),
                  _buildImagePicker(),
                  const SizedBox(height: 24),
                  _label('Full name *'),
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(hintText: 'e.g. Mr. Vincent Kumah'),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Full name is required' : null,
                  ),
                  const SizedBox(height: 16),
                  _label('Age *'),
                  _dropdown(
                    value: _ageRange,
                    items: options.ageRanges,
                    onChanged: (v) => setState(() => _ageRange = v),
                  ),
                  const SizedBox(height: 16),
                  _label('Gender *'),
                  _dropdown(
                    value: _gender,
                    items: options.genders,
                    onChanged: (v) => setState(() => _gender = v),
                  ),
                  const SizedBox(height: 16),
                  _label('Marital Status *'),
                  _dropdown(
                    value: _maritalStatus,
                    items: options.maritalStatuses,
                    onChanged: (v) => setState(() => _maritalStatus = v),
                  ),
                  const SizedBox(height: 16),
                  _label('Email address'),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(hintText: 'Your answer'),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return null;
                      final ok = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim());
                      return ok ? null : 'Enter a valid email address';
                    },
                  ),
                  const SizedBox(height: 16),
                  _label('Phone number *'),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(hintText: 'Your answer'),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Phone number is required' : null,
                  ),
                  const SizedBox(height: 16),
                  _label('Profession / Occupation *'),
                  _dropdown(
                    value: _professionCategory,
                    items: options.professionCategories,
                    onChanged: (v) => setState(() {
                      _professionCategory = v;
                      _professionSubCategory = null;
                    }),
                  ),
                  if (_needsSubCategory) ...[
                    const SizedBox(height: 16),
                    _label('Specific trade / business type *'),
                    _groupedSubCategoryDropdown(options),
                  ],
                  const SizedBox(height: 16),
                  _label('Place of Work *'),
                  TextFormField(
                    controller: _placeOfWorkController,
                    decoration: const InputDecoration(hintText: 'Your answer'),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Place of work is required' : null,
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Submit'),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildImagePicker() {
    return Center(
      child: GestureDetector(
        onTap: _pickImage,
        child: Stack(
          children: [
            CircleAvatar(
              radius: 48,
              backgroundColor: AppColors.background,
              backgroundImage: _pickedImageBytes != null
                  ? MemoryImage(_pickedImageBytes!)
                  : null,
              child: _pickedImageBytes == null
                  ? const Icon(Icons.person_outline, size: 44, color: AppColors.violetLight)
                  : null,
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: AppColors.violet,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(
          text,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textDark),
        ),
      );

  Widget _dropdown({
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      items: items
          .map((e) => DropdownMenuItem(value: e, child: Text(e)))
          .toList(),
      onChanged: onChanged,
      validator: (v) => v == null ? 'Required' : null,
      decoration: const InputDecoration(),
    );
  }

  Widget _groupedSubCategoryDropdown(BiodataOptions options) {
    final items = <DropdownMenuItem<String>>[];
    options.professionSubCategories.forEach((group, values) {
      items.add(DropdownMenuItem(
        enabled: false,
        value: '__header_$group',
        child: Text(
          group,
          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.violet),
        ),
      ));
      for (final v in values) {
        items.add(DropdownMenuItem(value: v, child: Text('  $v')));
      }
    });
    return DropdownButtonFormField<String>(
      initialValue: _professionSubCategory,
      isExpanded: true,
      items: items,
      selectedItemBuilder: (context) => items
          .map((item) => Text(
                item.value != null && item.value!.startsWith('__header_')
                    ? ''
                    : (item.child as Text).data ?? '',
                overflow: TextOverflow.ellipsis,
              ))
          .toList(),
      onChanged: (v) {
        if (v != null && v.startsWith('__header_')) return;
        setState(() => _professionSubCategory = v);
      },
      validator: (v) => (v == null) ? 'Required' : null,
      decoration: const InputDecoration(),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppColors.violetLight),
            const SizedBox(height: 12),
            Text(
              'Could not reach the server.\n$message',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted),
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
