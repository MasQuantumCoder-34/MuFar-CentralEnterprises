import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../theme/app_theme.dart';

class AppNetworkImage extends StatefulWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final double borderRadius;
  final Color? backgroundColor;
  final Color? iconColor;

  const AppNetworkImage({
    super.key,
    this.imageUrl,
    this.width,
    this.height,
    this.borderRadius = 12,
    this.backgroundColor,
    this.iconColor,
  });

  @override
  State<AppNetworkImage> createState() => _AppNetworkImageState();
}

class _AppNetworkImageState extends State<AppNetworkImage> {
  Uint8List? _bytes;
  bool _loading = false;
  bool _errored = false;

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  @override
  void didUpdateWidget(AppNetworkImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.imageUrl != widget.imageUrl) {
      _bytes = null;
      _errored = false;
      _loadImage();
    }
  }

  Future<void> _loadImage() async {
    final url = widget.imageUrl;
    if (url == null || url.isEmpty) return;
    setState(() {
      _loading = true;
      _errored = false;
    });
    try {
      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 30));
      if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
        if (mounted) setState(() {
          _bytes = response.bodyBytes;
          _loading = false;
        });
      } else {
        if (mounted) setState(() {
          _errored = true;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() {
        _errored = true;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.backgroundColor ?? AppTheme.primary.withOpacity(0.08);
    final noImageIconColor = widget.iconColor ?? AppTheme.textTertiary;

    Widget child;
    if (_bytes != null) {
      child = ClipRRect(
        borderRadius: BorderRadius.circular(widget.borderRadius),
        child: Image.memory(
          _bytes!,
          fit: BoxFit.cover,
          width: widget.width,
          height: widget.height,
        ),
      );
    } else if (_loading) {
      child = Center(
        child: SizedBox(
          width: 20, height: 20,
          child: CircularProgressIndicator(strokeWidth: 2, color: noImageIconColor),
        ),
      );
    } else {
      child = Center(
        child: Icon(_errored ? Icons.broken_image_outlined : Icons.image_outlined,
            color: _errored ? AppTheme.error : noImageIconColor, size: 28),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: Container(
        width: widget.width,
        height: widget.height,
        constraints: (widget.width == null || widget.height == null) ? const BoxConstraints.expand() : null,
        color: _bytes != null ? null : bgColor,
        child: child,
      ),
    );
  }
}
