/// Mirrors the backend's room id scheme (see chat.constants.ts) so both
/// sides always compute the same room id for a given pair/category.
class ChatRooms {
  ChatRooms._();

  static String category(String category) => 'cat::$category';

  static String dm(String phoneA, String phoneB) {
    final sorted = [phoneA, phoneB]..sort();
    return 'dm::${sorted[0]}::${sorted[1]}';
  }
}
