/// Maps a profession category string (as returned by the backend's
/// /biodata/options) to its bundled illustration asset and a short display
/// label. Matches on distinctive keywords rather than the full string, since
/// the full category text is long and parenthetical-heavy.
class ProfessionImages {
  ProfessionImages._();

  static const String _base = 'assets/images/professions';

  static String assetFor(String category) {
    if (category.contains('Healthcare')) return '$_base/healthcare.jpg';
    if (category.contains('Engineers')) return '$_base/engineers-architects.jpg';
    if (category.contains('Lawyers') || category.contains('Legal')) {
      return '$_base/legal.jpg';
    }
    if (category.contains('ICT')) return '$_base/ict.jpg';
    if (category.contains('Administrative')) return '$_base/administrative.jpg';
    if (category.contains('Accountants')) return '$_base/accounting.jpg';
    if (category.contains('Hospitality')) return '$_base/hospitality.jpg';
    if (category.contains('Teachers')) return '$_base/teachers-educators.jpg';
    if (category.contains('Service Professionals')) return '$_base/service.jpg';
    if (category.contains('Media')) return '$_base/media-communication.jpg';
    if (category.contains('Non-Governmental')) return '$_base/ngo.jpg';
    if (category.contains('Businessmen')) return '$_base/artisans-vendors.jpg';
    return '$_base/service.jpg';
  }

  /// Strips the trailing parenthetical detail (e.g. "(paralegals, legal
  /// clerks...)") so the card label stays short and readable.
  static String shortLabel(String category) {
    final idx = category.indexOf('(');
    return (idx == -1 ? category : category.substring(0, idx)).trim();
  }
}
