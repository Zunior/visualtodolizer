// Helper class to parse text and find Windows paths and URLs
class TextSegment {
  final String text;
  final String type; // 'text', 'url', or 'path'
  final String value;

  TextSegment({
    required this.text,
    required this.type,
    required this.value,
  });
}

List<TextSegment> parseTextForLinks(String text) {
  final segments = <TextSegment>[];
  
  // Regex for Windows paths (C:\..., \\server\..., etc.)
  final windowsPathRegex = RegExp(
    r'([A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*)|(\\\\[^\\/:*?"<>|\r\n]+(?:\\[^\\/:*?"<>|\r\n]+)*)',
  );
  
  // Regex for URLs (http://, https://, ftp://, etc.)
  final urlRegex = RegExp(r'(https?://[^\s]+|ftp://[^\s]+)', caseSensitive: false);
  
  final matches = <({int start, int end, String type, String value})>[];
  
  // Find all Windows paths
  for (final match in windowsPathRegex.allMatches(text)) {
    matches.add((
      start: match.start,
      end: match.end,
      type: 'path',
      value: match.group(0)!,
    ));
  }
  
  // Find all URLs
  for (final match in urlRegex.allMatches(text)) {
    matches.add((
      start: match.start,
      end: match.end,
      type: 'url',
      value: match.group(0)!,
    ));
  }
  
  // Sort matches by position
  matches.sort((a, b) => a.start.compareTo(b.start));
  
  // Remove overlapping matches (prefer URLs over paths)
  final filteredMatches = <({int start, int end, String type, String value})>[];
  for (final currentMatch in matches) {
    final overlaps = filteredMatches.any(
      (existing) => currentMatch.start < existing.end && currentMatch.end > existing.start,
    );
    if (!overlaps) {
      filteredMatches.add(currentMatch);
    }
  }
  
  // Build segments
  int lastIndex = 0;
  for (final match in filteredMatches) {
    if (match.start > lastIndex) {
      segments.add(TextSegment(
        text: text.substring(lastIndex, match.start),
        type: 'text',
        value: '',
      ));
    }
    segments.add(TextSegment(
      text: text.substring(match.start, match.end),
      type: match.type,
      value: match.value,
    ));
    lastIndex = match.end;
  }
  
  if (lastIndex < text.length) {
    segments.add(TextSegment(
      text: text.substring(lastIndex),
      type: 'text',
      value: '',
    ));
  }
  
  return segments.isEmpty 
      ? [TextSegment(text: text, type: 'text', value: '')]
      : segments;
}
