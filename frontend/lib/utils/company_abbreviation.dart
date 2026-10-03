/// Shortens a member's place of work so it fits on a directory card, e.g.
/// "Palace Royal International School" -> "Palace Royal Int'l Sch." and
/// "Ghana Ports and Harbours Authority" -> "GPHA". The full name is still
/// shown on the member's profile page.
class CompanyAbbreviation {
  CompanyAbbreviation._();

  /// Roughly one line of the card's place-of-work text.
  static const int maxLength = 24;

  static const Map<String, String> _words = {
    'international': "Int'l",
    'limited': 'Ltd',
    'company': 'Co.',
    'assembly': 'Assy',
    'authority': 'Auth.',
    'hospital': 'Hosp.',
    'school': 'Sch.',
    'college': 'Coll.',
    'education': 'Educ.',
    'services': 'Svcs',
    'service': 'Svc',
    'regional': 'Reg.',
    'management': 'Mgt',
    'managers': 'Mgrs',
    'national': "Nat'l",
    'industrial': 'Ind.',
    'commission': 'Comm.',
    'programme': 'Prog.',
    'development': "Dev't",
    'centre': 'Ctr',
    'center': 'Ctr',
    'complex': 'Cplx',
    'secretariat': 'Sec.',
    'laboratory': 'Lab',
    'medical': 'Med.',
    'enterprise': 'Ent.',
    'enterprises': 'Ent.',
    'insurance': 'Ins.',
    'engineering': 'Eng.',
    'municipal': 'Mun.',
    'university': 'Univ.',
    'government': 'Govt',
    'ministry': 'Min.',
    'department': 'Dept',
    'association': 'Assoc.',
    'corporation': 'Corp.',
    'technology': 'Tech.',
    'foundation': 'Fdn',
    'agency': 'Agcy',
    'institute': 'Inst.',
    'metropolitan': 'Metro.',
    'district': 'Dist.',
    'general': 'Gen.',
    'advisory': 'Adv.',
    'teaching': 'Tchg',
    'and': '&',
  };

  static const Set<String> _stopWords = {
    'of', 'and', 'the', 'for', '&', 'at', 'in', 'on', //
  };

  /// Words that mark a formal institution, whose initials are commonly used
  /// as its name (GPHA, NSCS, SEC...). Without one, a name like "Daisies And
  /// Details Nail Studio" is left readable rather than turned into "DDNS".
  static const Set<String> _institutionWords = {
    'authority', 'council', 'commission', 'programme', 'program',
    'secretariat', 'hospital', 'assembly', 'ministry', 'agency', 'board',
    'institute', 'service', 'services', 'bank', 'university', 'college',
    'school', 'corporation', 'department',
  };

  static String shorten(String placeOfWork) {
    var name = placeOfWork.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (name.endsWith('.')) name = name.substring(0, name.length - 1);
    if (name.length <= maxLength) return name;

    // Drop trailing detail: " - Cantonments", " / Remote", "(MLGCRA)",
    // ", Ghana".
    var core = name.split(RegExp(r'\s+[-/]\s+|\s*\(')).first.trim();
    core = core
        .replaceFirst(RegExp(r',\s*\w+\.?$'), '')
        .trim()
        .replaceFirst(RegExp(r'[,.]+$'), '');
    // e.g. "Accra, (Itracco Gh. Ltd...)" - the part before "(" isn't the name.
    if (core.length < 8) core = name;
    if (core.length <= maxLength) return core;

    final words = core.split(' ');
    final abbreviated =
        words.map((w) => _words[w.toLowerCase()] ?? w).join(' ');
    if (abbreviated.length <= maxLength) return abbreviated;

    final significant = words
        .where((w) => w.isNotEmpty && !_stopWords.contains(w.toLowerCase()))
        .toList();
    final isProperName = significant.every(
      (w) => !_isLetter(w[0]) || w[0] == w[0].toUpperCase(),
    );
    final isInstitution = significant
        .any((w) => _institutionWords.contains(w.toLowerCase()));
    if (significant.length >= 3 && isProperName && isInstitution) {
      return significant
          .where((w) => _isLetter(w[0]))
          .map((w) => w[0].toUpperCase())
          .join();
    }
    // Long free-text answers ("Around agbogba police station") stay as
    // words; the card wraps and ellipsizes them.
    return abbreviated;
  }

  static bool _isLetter(String c) => c.toLowerCase() != c.toUpperCase();
}
