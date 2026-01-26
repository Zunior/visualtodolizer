import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:pluto_grid/pluto_grid.dart';
import '../services/firestore_service.dart';
import '../theme/scifi_theme.dart';

// Custom painter for left-side row selection indicators
class _LeftSideRowPainter extends CustomPainter {
  final bool isSelected;

  _LeftSideRowPainter({
    required this.isSelected,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final centerX = size.width / 2;
    final centerY = size.height / 2;

    if (isSelected) {
      // Draw left border indicator
      paint.color = SciFiTheme.neonCyan;
      paint.style = PaintingStyle.fill;
      final leftRect = Rect.fromLTWH(0, 0, 3, size.height);
      canvas.drawRect(leftRect, paint);

      // Draw selection background
      paint.color = SciFiTheme.neonCyan.withOpacity(0.2);
      final bgRect = Rect.fromLTWH(0, 0, size.width, size.height);
      canvas.drawRect(bgRect, paint);

      // Draw checkmark icon
      paint.color = SciFiTheme.neonCyan;
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 2;
      final radius = 8.0;
      canvas.drawCircle(Offset(centerX, centerY), radius, paint);
      
      // Draw checkmark
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 2.5;
      paint.strokeCap = StrokeCap.round;
      paint.strokeJoin = StrokeJoin.round;
      final checkPath = Path();
      checkPath.moveTo(centerX - 4, centerY);
      checkPath.lineTo(centerX - 1, centerY + 3);
      checkPath.lineTo(centerX + 4, centerY - 2);
      canvas.drawPath(checkPath, paint);
    } else {
      // Draw subtle indicator when not selected (so users know it's clickable)
      paint.color = SciFiTheme.borderDim;
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 1;
      final borderRect = Rect.fromLTWH(0, 0, size.width, size.height);
      canvas.drawRect(borderRect, paint);
      
      // Draw a subtle circle indicator
      paint.color = SciFiTheme.textSecondary.withOpacity(0.3);
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 1.5;
      final radius = 6.0;
      canvas.drawCircle(Offset(centerX, centerY), radius, paint);
    }
  }

  @override
  bool shouldRepaint(_LeftSideRowPainter oldDelegate) {
    return oldDelegate.isSelected != isSelected;
  }
}

// Custom painter for left-side header selection indicators
class _LeftSideHeaderPainter extends CustomPainter {
  final bool isSelected;

  _LeftSideHeaderPainter({
    required this.isSelected,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final centerX = size.width / 2;
    final centerY = size.height / 2;

    if (isSelected) {
      // Draw left border indicator
      paint.color = SciFiTheme.neonCyan;
      paint.style = PaintingStyle.fill;
      final leftRect = Rect.fromLTWH(0, 0, 3, size.height);
      canvas.drawRect(leftRect, paint);

      // Draw selection background
      paint.color = SciFiTheme.neonCyan.withOpacity(0.2);
      final bgRect = Rect.fromLTWH(0, 0, size.width, size.height);
      canvas.drawRect(bgRect, paint);

      // Draw checkmark icon
      paint.color = SciFiTheme.neonCyan;
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 2;
      final radius = 8.0;
      canvas.drawCircle(Offset(centerX, centerY), radius, paint);
      
      // Draw checkmark
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 2.5;
      paint.strokeCap = StrokeCap.round;
      paint.strokeJoin = StrokeJoin.round;
      final checkPath = Path();
      checkPath.moveTo(centerX - 4, centerY);
      checkPath.lineTo(centerX - 1, centerY + 3);
      checkPath.lineTo(centerX + 4, centerY - 2);
      canvas.drawPath(checkPath, paint);
    } else {
      // Draw subtle indicator when not selected (so users know it's clickable)
      paint.color = SciFiTheme.borderDim;
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 1;
      final borderRect = Rect.fromLTWH(0, 0, size.width, size.height);
      canvas.drawRect(borderRect, paint);
      
      // Draw a subtle circle indicator
      paint.color = SciFiTheme.textSecondary.withOpacity(0.3);
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 1.5;
      final radius = 6.0;
      canvas.drawCircle(Offset(centerX, centerY), radius, paint);
    }
  }

  @override
  bool shouldRepaint(_LeftSideHeaderPainter oldDelegate) {
    return oldDelegate.isSelected != isSelected;
  }
}

class TableEditor extends StatefulWidget {
  final String nodeId;
  final VoidCallback? onClose;

  const TableEditor({
    super.key,
    required this.nodeId,
    this.onClose,
  });

  @override
  State<TableEditor> createState() => _TableEditorState();
}

class _TableEditorState extends State<TableEditor> {
  final FirestoreService _firestoreService = FirestoreService();
  final GlobalKey _gridKey = GlobalKey();
  PlutoGridStateManager? _stateManager;
  bool _loading = true;
  bool _saving = false;
  List<PlutoColumn> _columns = [];
  List<PlutoRow> _rows = [];
  int? _selectedColumnIndex; // Selected column for deletion
  int? _selectedRowIndex; // Selected row for deletion

  @override
  void initState() {
    super.initState();
    _loadTableData();
  }

  Future<void> _loadTableData() async {
    setState(() => _loading = true);
    try {
      final node = await _firestoreService.getNode(widget.nodeId);
      final content = node.content ?? '';

      if (content.isEmpty) {
        // Initialize with default columns
        _initializeDefaultTable();
      } else {
        // Load from JSON
        _loadFromJson(content);
      }
      
      // Ensure state is updated after loading
      if (mounted) {
        setState(() {
          // State is already updated by _loadFromJson or _initializeDefaultTable
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading table: $e')),
        );
        _initializeDefaultTable();
        setState(() => _loading = false);
      }
    }
  }

  // Helper to add left padding to column titles (to avoid overlap with selection area)
  String _addTitlePadding(String title, {bool skipPadding = false}) {
    if (skipPadding) return title;
    // Add padding equivalent to ~30px (left-side selection area width)
    // Using non-breaking spaces for consistent spacing
    return '\u2003\u2003\u2003$title'; // 3 em spaces ≈ 30px
  }

  // Helper to add left padding to row numbers (to avoid overlap with selection area)
  String _addRowNumberPadding(String rowNumber) {
    // Add padding equivalent to ~30px (left-side selection area width)
    // Row number column is 100px wide, selection box is 30px, so we need ~30px padding
    return '\u2003\u2003\u2003$rowNumber'; // 3 em spaces ≈ 30px
  }

  void _initializeDefaultTable() {
    _columns = [
      // Row number column (first column, like Excel)
      PlutoColumn(
        title: '#',
        field: '_rowNumber',
        type: PlutoColumnType.text(),
        width: 100, // Increased width to accommodate selection box + row number
        readOnly: true,
        enableEditingMode: false,
      ),
      PlutoColumn(
        title: _addTitlePadding('Column 1'),
        field: 'col1',
        type: PlutoColumnType.text(),
        width: 150,
      ),
      PlutoColumn(
        title: _addTitlePadding('Column 2'),
        field: 'col2',
        type: PlutoColumnType.text(),
        width: 150,
      ),
    ];
    _rows = [];
  }

  void _loadFromJson(String jsonString) {
    try {
      final data = json.decode(jsonString) as Map<String, dynamic>;
      final columnsData = data['columns'] as List<dynamic>? ?? [];
      final rowsData = data['rows'] as List<dynamic>? ?? [];

      print('Loading table: ${columnsData.length} columns, ${rowsData.length} rows');

      // Load columns - add row number column first if not present
      bool hasRowNumberColumn = columnsData.any((col) => 
        (col as Map<String, dynamic>)['field'] == '_rowNumber'
      );
      
      _columns = [];
      
      // Add row number column first if not present
      if (!hasRowNumberColumn) {
        _columns.add(
          PlutoColumn(
            title: '#',
            field: '_rowNumber',
            type: PlutoColumnType.text(),
            width: 100, // Increased width to accommodate selection box + row number
            readOnly: true,
            enableEditingMode: false,
          ),
        );
      }
      
      // Load other columns
      _columns.addAll(columnsData.map((col) {
        final colMap = col as Map<String, dynamic>;
        final field = colMap['field'] as String? ?? 'field';
        
        // Skip row number column if it was in the data (we already added it)
        if (field == '_rowNumber') {
          return null;
        }
        
        final typeStr = colMap['type'] as String? ?? 'text';
        PlutoColumnType columnType;
        
        switch (typeStr) {
          case 'number':
            columnType = PlutoColumnType.number();
            break;
          case 'date':
            columnType = PlutoColumnType.date();
            break;
          case 'select':
            final options = (colMap['options'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ?? [];
            columnType = PlutoColumnType.select(options);
            break;
          default:
            columnType = PlutoColumnType.text();
        }

        final originalTitle = colMap['title'] as String? ?? 'Column';
        // Remove any existing padding before adding new padding (in case of reload)
        final cleanTitle = originalTitle.replaceAll(RegExp(r'^[\u2003\s]+'), '');
        return PlutoColumn(
          title: _addTitlePadding(cleanTitle),
          field: field,
          type: columnType,
          width: (colMap['width'] as num?)?.toDouble() ?? 150,
        );
      }).whereType<PlutoColumn>());

      // Load rows
      _rows = rowsData.asMap().entries.map((entry) {
        final rowIndex = entry.key;
        final rowData = entry.value as Map<String, dynamic>;
        final cells = <String, PlutoCell>{};
        
        for (var col in _columns) {
          if (col.field == '_rowNumber') {
            // Set row number with padding
            cells[col.field] = PlutoCell(value: _addRowNumberPadding('${rowIndex + 1}'));
          } else {
            final value = rowData[col.field] ?? '';
            cells[col.field] = PlutoCell(value: value);
          }
        }

        return PlutoRow(
          cells: cells,
        );
      }).toList();
      
      print('Loaded ${_columns.length} columns and ${_rows.length} rows');
    } catch (e) {
      print('Error loading JSON: $e');
      // If JSON parsing fails, initialize default
      _initializeDefaultTable();
    }
  }

  String _toJson() {
    // Use state manager if available, otherwise use local state
    final columns = _stateManager != null ? _stateManager!.columns : _columns;
    final rows = _stateManager != null ? _stateManager!.rows : _rows;
    
    // Exclude row number column from saved data
    final columnsData = columns
        .where((col) => col.field != '_rowNumber')
        .map((col) {
      // Strip padding from title before saving
      final cleanTitle = col.title.replaceAll(RegExp(r'^[\u2003\s]+'), '');
      final colData = {
        'title': cleanTitle,
        'field': col.field,
        'width': col.width,
        'type': _getColumnTypeString(col.type),
      };
      
      if (col.type.isSelect) {
        colData['options'] = col.type.select.items;
      }
      
      return colData;
    }).toList();

    final rowsData = rows.map((row) {
      final rowData = <String, dynamic>{};
      for (var cell in row.cells.values) {
        // Exclude row number from saved data
        if (cell.column.field != '_rowNumber') {
          rowData[cell.column.field] = cell.value;
        }
      }
      return rowData;
    }).toList();

    return json.encode({
      'columns': columnsData,
      'rows': rowsData,
    });
  }

  String _getColumnTypeString(PlutoColumnType type) {
    if (type.isText) return 'text';
    if (type.isNumber) return 'number';
    if (type.isDate) return 'date';
    if (type.isSelect) return 'select';
    return 'text';
  }

  Future<void> _handleSave() async {
    setState(() => _saving = true);
    try {
      final jsonData = _toJson();
      await _firestoreService.updateNode(widget.nodeId, content: jsonData);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Table saved successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving table: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  String _generateUniqueFieldName(List<PlutoColumn> existingColumns) {
    int counter = 1;
    String candidate;
    Set<String> existingFields = existingColumns.map((col) => col.field).toSet();
    
    do {
      candidate = 'col$counter';
      counter++;
    } while (existingFields.contains(candidate));
    
    return candidate;
  }

  void _addColumn() {
    // Always update local state and let widget rebuild
    // The state manager will automatically sync when widget rebuilds
    final newField = _generateUniqueFieldName(_columns);
    // Count only data columns (excluding row number column)
    final dataColumnCount = _columns.where((col) => col.field != '_rowNumber').length;
    final newColumn = PlutoColumn(
      title: _addTitlePadding('Column ${dataColumnCount + 1}'),
      field: newField,
      type: PlutoColumnType.text(),
      width: 150,
    );
    
    // Clear state manager reference to force fresh rebuild
    _stateManager = null;
    
    setState(() {
      _columns.add(newColumn);
      
      // Add the new column to all existing rows
      for (var row in _rows) {
        row.cells[newField] = PlutoCell(value: '');
      }
    });
  }

  void _addRow() {
    // Always update local state and let widget rebuild
    // The state manager will automatically sync when widget rebuilds
    final rowNumber = _rows.length + 1;
    final newRow = PlutoRow(
      cells: _columns.asMap().map((index, col) {
        if (col.field == '_rowNumber') {
          return MapEntry(col.field, PlutoCell(value: _addRowNumberPadding('$rowNumber')));
        }
        return MapEntry(col.field, PlutoCell(value: ''));
      }),
    );
    
    setState(() {
      _rows.add(newRow);
    });
  }

  void _removeColumn(int columnIndex) {
    if (_columns.length <= 1) {
      // Don't allow removing the last column
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot remove the last column')),
      );
      return;
    }
    
    if (columnIndex < 0 || columnIndex >= _columns.length) {
      return;
    }
    
    final removedColumn = _columns[columnIndex];
    final removedField = removedColumn.field;
    
    // Clear state manager reference to force fresh rebuild
    _stateManager = null;
    
    setState(() {
      _columns.removeAt(columnIndex);
      
      // Remove the column from all existing rows
      for (var row in _rows) {
        row.cells.remove(removedField);
      }
      
      // Clear selection if the removed column was selected
      if (_selectedColumnIndex == columnIndex) {
        _selectedColumnIndex = null;
      } else if (_selectedColumnIndex != null && _selectedColumnIndex! > columnIndex) {
        // Adjust selection index if a column before the selected one was removed
        _selectedColumnIndex = _selectedColumnIndex! - 1;
      }
    });
  }

  void _removeRow(int rowIndex) {
    if (rowIndex < 0 || rowIndex >= _rows.length) {
      return;
    }
    
    setState(() {
      _rows.removeAt(rowIndex);
      
      // Renumber rows
      for (var i = 0; i < _rows.length; i++) {
        final rowNumberCell = _rows[i].cells['_rowNumber'];
        if (rowNumberCell != null) {
          rowNumberCell.value = _addRowNumberPadding('${i + 1}');
        }
      }
      
      // Clear selection if the removed row was selected
      if (_selectedRowIndex == rowIndex) {
        _selectedRowIndex = null;
      } else if (_selectedRowIndex != null && _selectedRowIndex! > rowIndex) {
        // Adjust selection index if a row before the selected one was removed
        _selectedRowIndex = _selectedRowIndex! - 1;
      }
    });
  }

  Widget _buildCustomHeaderOverlay() {
    // Show overlay as long as we have columns, even if stateManager is temporarily null
    // (it gets cleared during column add/remove operations)
    if (_columns.isEmpty) {
      return const SizedBox.shrink();
    }

    // Calculate header row height (typically around 40-50px)
    const double headerHeight = 45.0;
    const double leftSideWidth = 30.0; // Left side area for selection

    // Build left-side clickable areas for each column
    return IgnorePointer(
      ignoring: false,
      child: Stack(
        clipBehavior: Clip.none,
        children: _buildLeftSideOverlays(headerHeight, leftSideWidth),
      ),
    );
  }

  List<Widget> _buildLeftSideOverlays(double headerHeight, double leftSideWidth) {
    final overlays = <Widget>[];
    double currentX = 0;

    // Account for row number column width if present
    final hasRowNumber = _columns.isNotEmpty && _columns.first.field == '_rowNumber';
    if (hasRowNumber) {
      currentX += _columns.first.width;
    }

    // Create overlay for each data column's left side
    for (int i = hasRowNumber ? 1 : 0; i < _columns.length; i++) {
      final column = _columns[i];
      final isSelected = _selectedColumnIndex == i;

      overlays.add(
        Positioned(
          top: 0,
          left: currentX,
          width: leftSideWidth,
          height: headerHeight,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                // Left side clicked - toggle column selection
                setState(() {
                  if (_selectedColumnIndex == i) {
                    // Already selected - deselect it
                    _selectedColumnIndex = null;
                  } else {
                    // Not selected - select it
                    _selectedColumnIndex = i;
                    _selectedRowIndex = null; // Clear row selection
                  }
                });
              },
            child: Container(
              // Temporary: Add a very subtle background to verify overlay is visible
              // Remove this after confirming it works
              decoration: BoxDecoration(
                color: isSelected 
                    ? SciFiTheme.neonCyan.withOpacity(0.1)
                    : Colors.transparent,
                border: Border(
                  left: BorderSide(
                    color: isSelected ? SciFiTheme.neonCyan : SciFiTheme.borderDim.withOpacity(0.3),
                    width: isSelected ? 3 : 1,
                  ),
                ),
              ),
              child: CustomPaint(
                size: Size(leftSideWidth, headerHeight),
                painter: _LeftSideHeaderPainter(
                  isSelected: isSelected,
                ),
              ),
            ),
            ),
          ),
        ),
      );

      currentX += column.width;
    }

    return overlays;
  }

  Widget _buildRowSelectionOverlay() {
    if (_rows.isEmpty) {
      return const SizedBox.shrink();
    }

    // Row height - PlutoGrid default includes borders, typically around 43-44px
    // Need to account for row borders which add ~1-2px per row
    const double rowHeight = 43.5; // Slightly increased to account for borders between rows
    const double leftSideWidth = 30.0; // Left side area for selection
    // Header row height - PlutoGrid uses around 45-50px for headers
    const double headerHeight = 48.0; // Slightly increased for better alignment

    // Build left-side clickable areas for each row
    return IgnorePointer(
      ignoring: false,
      child: Stack(
        clipBehavior: Clip.none,
        children: _buildRowSelectionOverlays(rowHeight, leftSideWidth, headerHeight),
      ),
    );
  }

  List<Widget> _buildRowSelectionOverlays(double rowHeight, double leftSideWidth, double headerHeight) {
    final overlays = <Widget>[];
    
    // Always account for filter row - PlutoGrid may show it even if not explicitly enabled
    // PlutoGrid filter row is typically around 40-45px
    // We'll always add it to ensure selection boxes start from first data row
    const double filterRowHeight = 45.0; // Always account for filter row space
    final totalHeaderHeight = headerHeight + filterRowHeight;
    
    // Create overlay for each row's left side (skip header and filter rows)
    // Account for grid borders - each row has a border that adds to spacing
    const double borderWidth = 1.0; // Border width between rows
    const double initialOffset = 1.0; // Initial offset to account for grid top border
    
    for (int i = 0; i < _rows.length; i++) {
      final isSelected = _selectedRowIndex == i;
      // Calculate position: header + filter + (row index * (row height + border))
      // Each row after the first adds a border width
      final topPosition = totalHeaderHeight + initialOffset + (i * (rowHeight + borderWidth));

      overlays.add(
        Positioned(
          top: topPosition,
          left: 0,
          width: leftSideWidth,
          height: rowHeight,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                // Left side clicked - toggle row selection
                setState(() {
                  if (_selectedRowIndex == i) {
                    // Already selected - deselect it
                    _selectedRowIndex = null;
                  } else {
                    // Not selected - select it
                    _selectedRowIndex = i;
                    _selectedColumnIndex = null; // Clear column selection
                  }
                });
              },
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected 
                      ? SciFiTheme.neonCyan.withOpacity(0.1)
                      : Colors.transparent,
                  border: Border(
                    left: BorderSide(
                      color: isSelected ? SciFiTheme.neonCyan : SciFiTheme.borderDim.withOpacity(0.3),
                      width: isSelected ? 3 : 1,
                    ),
                  ),
                ),
                child: CustomPaint(
                  size: Size(leftSideWidth, rowHeight),
                  painter: _LeftSideRowPainter(
                    isSelected: isSelected,
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return overlays;
  }



  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: SciFiTheme.neonCyan),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: SciFiTheme.bgSecondary,
        border: SciFiTheme.defaultBorder,
        borderRadius: BorderRadius.circular(4),
        boxShadow: SciFiTheme.glow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header with buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: _addColumn,
                    icon: const Icon(Icons.add, color: SciFiTheme.neonCyan, size: 18),
                    label: const Text('Add Column', style: TextStyle(color: SciFiTheme.neonCyan)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      side: const BorderSide(color: SciFiTheme.borderPrimary),
                      shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
                      elevation: 8,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _selectedColumnIndex != null && _columns.length > 1 
                        ? () => _removeColumn(_selectedColumnIndex!) 
                        : null,
                    icon: const Icon(Icons.remove, color: SciFiTheme.neonCyan, size: 18),
                    label: Text(
                      _selectedColumnIndex != null 
                          ? 'Remove Column ${_selectedColumnIndex! + 1}' 
                          : 'Remove Column',
                      style: const TextStyle(color: SciFiTheme.neonCyan),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedColumnIndex != null 
                          ? SciFiTheme.neonCyan.withOpacity(0.2)
                          : Colors.transparent,
                      side: BorderSide(
                        color: _selectedColumnIndex != null 
                            ? SciFiTheme.neonCyan 
                            : SciFiTheme.borderPrimary,
                        width: _selectedColumnIndex != null ? 2 : 1,
                      ),
                      shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
                      elevation: 8,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _addRow,
                    icon: const Icon(Icons.add, color: SciFiTheme.neonCyan, size: 18),
                    label: const Text('Add Row', style: TextStyle(color: SciFiTheme.neonCyan)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      side: const BorderSide(color: SciFiTheme.borderPrimary),
                      shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
                      elevation: 8,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _selectedRowIndex != null && _rows.isNotEmpty
                        ? () => _removeRow(_selectedRowIndex!)
                        : null,
                    icon: const Icon(Icons.remove, color: SciFiTheme.neonCyan, size: 18),
                    label: Text(
                      _selectedRowIndex != null 
                          ? 'Remove Row ${_selectedRowIndex! + 1}' 
                          : 'Remove Row',
                      style: const TextStyle(color: SciFiTheme.neonCyan),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedRowIndex != null 
                          ? SciFiTheme.neonCyan.withOpacity(0.2)
                          : Colors.transparent,
                      side: BorderSide(
                        color: _selectedRowIndex != null 
                            ? SciFiTheme.neonCyan 
                            : SciFiTheme.borderPrimary,
                        width: _selectedRowIndex != null ? 2 : 1,
                      ),
                      shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
                      elevation: 8,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  ElevatedButton(
                    onPressed: _saving ? null : _handleSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      side: const BorderSide(color: SciFiTheme.borderPrimary),
                      shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
                      elevation: 8,
                    ),
                    child: Text(
                      _saving ? 'Saving...' : 'Save',
                      style: const TextStyle(color: SciFiTheme.neonCyan),
                    ),
                  ),
                  if (widget.onClose != null) ...[
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.close, color: SciFiTheme.neonCyan),
                      onPressed: widget.onClose,
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          // PlutoGrid
          Expanded(
            child: _columns.isEmpty 
                ? const Center(
                    child: Text(
                      'No columns defined',
                      style: TextStyle(color: SciFiTheme.textSecondary),
                    ),
                  )
                : Stack(
                    clipBehavior: Clip.none,
                    children: [
                      PlutoGrid(
                        key: ValueKey('grid_${_columns.length}_${_columns.map((c) => c.field).join('_')}'),
                        columns: _columns,
                        rows: _rows,
                        onLoaded: (PlutoGridOnLoadedEvent event) {
                          _stateManager = event.stateManager;
                          
                          // Configure grid for better UX
                          _stateManager!.setShowColumnFilter(true);
                          _stateManager!.setShowColumnTitle(true);
                        },
                        onSelected: (PlutoGridOnSelectedEvent event) {
                          // Handle cell selection
                          if (event.cell != null) {
                            final column = event.cell!.column;
                            
                            // Row number column clicked - toggle row selection
                            if (column.field == '_rowNumber') {
                              final rowIndex = event.rowIdx;
                              if (rowIndex != null && rowIndex >= 0 && rowIndex < _rows.length) {
                                setState(() {
                                  if (_selectedRowIndex == rowIndex) {
                                    // Already selected - deselect it
                                    _selectedRowIndex = null;
                                  } else {
                                    // Not selected - select it
                                    _selectedRowIndex = rowIndex;
                                    _selectedColumnIndex = null;
                                  }
                                });
                              }
                            } else {
                              // Data column clicked - select column for removal
                              final columnIndex = _columns.indexOf(column);
                              if (columnIndex >= 0) {
                                setState(() {
                                  _selectedColumnIndex = columnIndex;
                                  _selectedRowIndex = null;
                                });
                              }
                            }
                          } else if (event.row != null) {
                            // Regular row selection - toggle
                            final rowIndex = event.rowIdx;
                            if (rowIndex != null && rowIndex >= 0 && rowIndex < _rows.length) {
                              setState(() {
                                if (_selectedRowIndex == rowIndex) {
                                  // Already selected - deselect it
                                  _selectedRowIndex = null;
                                } else {
                                  // Not selected - select it
                                  _selectedRowIndex = rowIndex;
                                  _selectedColumnIndex = null;
                                }
                              });
                            }
                          }
                        },
                        onSorted: (PlutoGridOnSortedEvent event) {
                          // Column sorting occurred
                          // Note: For left/right header click detection, we'd need custom header rendering
                          // For now, column selection can be done through other means
                        },
                        onRowSecondaryTap: (PlutoGridOnRowSecondaryTapEvent event) {
                          // Right-click on row - could be used for context menu
                        },
                        onChanged: (PlutoGridOnChangedEvent event) {
                          // Auto-save could be implemented here with debouncing
                        },
                        configuration: PlutoGridConfiguration(
                          columnSize: const PlutoGridColumnSizeConfig(
                            autoSizeMode: PlutoAutoSizeMode.none,
                            resizeMode: PlutoResizeMode.normal,
                          ),
                          style: PlutoGridStyleConfig(
                            gridBackgroundColor: SciFiTheme.bgTertiary,
                            rowColor: SciFiTheme.bgSecondary,
                            activatedBorderColor: SciFiTheme.neonCyan,
                            inactivatedBorderColor: SciFiTheme.borderDim,
                            checkedColor: SciFiTheme.neonCyan,
                            gridBorderColor: SciFiTheme.borderDim,
                            activatedColor: SciFiTheme.bgTertiary,
                            columnTextStyle: const TextStyle(
                              color: SciFiTheme.neonCyan,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                            cellTextStyle: const TextStyle(
                              color: SciFiTheme.textPrimary,
                              fontSize: 14,
                            ),
                            cellColorInReadOnlyState: SciFiTheme.bgTertiary,
                            menuBackgroundColor: SciFiTheme.bgSecondary,
                            iconColor: SciFiTheme.neonCyan,
                          ),
                          scrollbar: const PlutoGridScrollbarConfig(
                            isAlwaysShown: false,
                          ),
                        ),
                      ),
                      // Custom header overlay for left/right click detection
                      _buildCustomHeaderOverlay(),
                      // Custom row selection overlay
                      _buildRowSelectionOverlay(),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
