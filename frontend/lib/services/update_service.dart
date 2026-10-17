import 'dart:io';

import 'package:flutter/services.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

enum UpdateCheckResult {
  /// The Play update screen was shown and the update is installing.
  updating,

  /// Already on the newest version on Google Play.
  upToDate,

  /// The user backed out of the Play update screen.
  cancelled,

  /// Play's in-app update isn't available (not installed from Google Play,
  /// no Play Store on the device, not on Android); the Play listing was
  /// opened instead where possible.
  openedStore,

  /// Something went wrong talking to Google Play.
  failed,
}

/// Checks Google Play for a newer release and installs it from inside the
/// app using Play's in-app updates.
class UpdateService {
  static const _packageName = 'com.ipc.palace.palace_professional_network';

  /// e.g. "1.0.23 (27)".
  static Future<String> currentVersion() async {
    final info = await PackageInfo.fromPlatform();
    return '${info.version} (${info.buildNumber})';
  }

  static Future<UpdateCheckResult> checkAndUpdate() async {
    if (!Platform.isAndroid) {
      return await _openStore() ? UpdateCheckResult.openedStore : UpdateCheckResult.failed;
    }
    try {
      final info = await InAppUpdate.checkForUpdate();
      // A previous update was started but not finished: resume it.
      final inProgress = info.updateAvailability ==
          UpdateAvailability.developerTriggeredUpdateInProgress;
      if (info.updateAvailability != UpdateAvailability.updateAvailable && !inProgress) {
        return UpdateCheckResult.upToDate;
      }
      if (!info.immediateUpdateAllowed) {
        return await _openStore() ? UpdateCheckResult.openedStore : UpdateCheckResult.failed;
      }
      // Full-screen Play update; the app restarts on the new version.
      final result = await InAppUpdate.performImmediateUpdate();
      switch (result) {
        case AppUpdateResult.success:
          return UpdateCheckResult.updating;
        case AppUpdateResult.userDeniedUpdate:
          return UpdateCheckResult.cancelled;
        case AppUpdateResult.inAppUpdateFailed:
          return UpdateCheckResult.failed;
      }
    } on PlatformException {
      // Thrown when the app wasn't installed from Google Play (e.g. a
      // sideloaded or debug build), so fall back to the store listing.
      return await _openStore() ? UpdateCheckResult.openedStore : UpdateCheckResult.failed;
    }
  }

  static Future<bool> _openStore() async {
    final market = Uri.parse('market://details?id=$_packageName');
    final web = Uri.parse('https://play.google.com/store/apps/details?id=$_packageName');
    try {
      if (await launchUrl(market, mode: LaunchMode.externalApplication)) return true;
    } catch (_) {}
    try {
      return await launchUrl(web, mode: LaunchMode.externalApplication);
    } catch (_) {
      return false;
    }
  }
}
