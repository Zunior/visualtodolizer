import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:pluto_grid/pluto_grid.dart';
import '../services/firestore_service.dart';
import '../theme/scifi_theme.dart';

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
  double _horizontalScrollOffset = 0.0; // Track grid scroll position (initialized to 0)
  List<PlutoColumn> _columns = [];
  List<PlutoRow> _rows = [];
  Set<int> _selectedColumnIndices = {}; // Selected columns for deletion
  double? _actualRowHeight; // Detected actual row height
  double? _actualHeaderHeight; // Detected actual header height
  Map<int, double> _rowPositions = <int, double>{}; // Map of row index to actual Y position
  Map<int, GlobalKey> _rowKeys = <int, GlobalKey>{}; // GlobalKeys for each row number cell

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
    // Row number column is 50px wide, selection box is 30px, so we need ~30px padding
    return '\u2003\u2003\u2003$rowNumber'; // 3 em spaces ≈ 30px
  }

  // Create row number column with custom renderer for position detection
  PlutoColumn _createRowNumberColumn() {
    return PlutoColumn(
      title: '#',
      field: '_rowNumber',
      type: PlutoColumnType.text(),
      width: 70, // Increased width for row number column
      readOnly: true,
      enableEditingMode: false,
      renderer: (rendererContext) {
        // Use custom renderer to detect row position
        final rowIdx = rendererContext.rowIdx;
        // Create or get GlobalKey for this row
        if (!_rowKeys.containsKey(rowIdx)) {
          _rowKeys[rowIdx] = GlobalKey();
        }
        final rowKey = _rowKeys[rowIdx]!;
        
        // Measure position after frame is built
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final context = rowKey.currentContext;
          if (context != null) {
            final RenderBox? box = context.findRenderObject() as RenderBox?;
            if (box != null) {
              // Get position relative to the Stack (grid container)
              final position = box.localToGlobal(Offset.zero);
              // Get the grid's position to calculate relative position
              if (_gridKey.currentContext != null) {
                final RenderBox? gridBox = _gridKey.currentContext!.findRenderObject() as RenderBox?;
                if (gridBox != null) {
                  final gridPosition = gridBox.localToGlobal(Offset.zero);
                  final relativeY = position.dy - gridPosition.dy;
                  if (mounted) {
                    setState(() {
                      _rowPositions[rowIdx] = relativeY;
                    });
                  }
                }
              }
            }
          }
        });
        
        return Container(
          key: rowKey,
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(
            rendererContext.cell.value.toString(),
            style: const TextStyle(color: SciFiTheme.neonCyan),
          ),
        );
      },
    );
  }

  void _initializeDefaultTable() {
    _columns = [
      // Native row selection checkbox column
      // Note: PlutoGrid internally constrains checkbox columns to ~30px when enableRowChecked is true
      // This causes a 10px overflow warning, but the checkbox still functions correctly
      // The warning is cosmetic - the checkbox is still usable
      PlutoColumn(
        title: '',
        field: '_rowCheckbox',
        type: PlutoColumnType.text(),
        width: 80, // Increased width (60px + 20px)
        readOnly: true,
        enableEditingMode: false,
        enableRowChecked: true, // Enable native row selection
      ),
      // Row number column (second column, like Excel)
      _createRowNumberColumn(),
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
      
      // Add checkbox column and row number column first if not present
      bool hasCheckboxColumn = columnsData.any((col) => 
        (col as Map<String, dynamic>)['field'] == '_rowCheckbox'
      );
      
      if (!hasCheckboxColumn) {
        _columns.add(
          PlutoColumn(
            title: '',
            field: '_rowCheckbox',
            type: PlutoColumnType.text(),
            width: 80, // Increased width (60px + 20px)
            readOnly: true,
            enableEditingMode: false,
            enableRowChecked: true, // Enable native row selection
          ),
        );
      }
      
      if (!hasRowNumberColumn) {
        _columns.add(_createRowNumberColumn());
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
          if (col.field == '_rowCheckbox') {
            // Checkbox column - handled by PlutoGrid natively, just add empty cell
            cells[col.field] = PlutoCell(value: '');
          } else if (col.field == '_rowNumber') {
            // Set row number with padding and store row index for position detection
            final cell = PlutoCell(value: _addRowNumberPadding('${rowIndex + 1}'));
            // Store row index in cell for position tracking
            cells[col.field] = cell;
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
    
    // Exclude row number and checkbox columns from saved data
    final columnsData = columns
        .where((col) => col.field != '_rowNumber' && col.field != '_rowCheckbox')
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
      // Iterate over columns instead of cells to ensure we have column references
      for (var col in columns) {
        // Exclude row number and checkbox from saved data
        if (col.field != '_rowNumber' && col.field != '_rowCheckbox') {
          // Access cell by field name to avoid "cell.column" access on uninitialized cells
          final cell = row.cells[col.field];
          if (cell != null) {
            rowData[col.field] = cell.value;
          } else {
            rowData[col.field] = '';
          }
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
        if (col.field == '_rowCheckbox') {
          // Checkbox column - handled by PlutoGrid natively
          return MapEntry(col.field, PlutoCell(value: ''));
        } else if (col.field == '_rowNumber') {
          return MapEntry(col.field, PlutoCell(value: _addRowNumberPadding('$rowNumber')));
        }
        return MapEntry(col.field, PlutoCell(value: ''));
      }),
    );
    
    setState(() {
      _rows.add(newRow);
    });
  }

  void _removeSelectedColumns() {
    if (_selectedColumnIndices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No columns selected')),
      );
      return;
    }
    
    // Filter out system columns and invalid indices
    final validIndices = _selectedColumnIndices
        .where((index) => 
            index >= 0 && 
            index < _columns.length &&
            _columns[index].field != '_rowCheckbox' &&
            _columns[index].field != '_rowNumber')
        .toList()
      ..sort((a, b) => b.compareTo(a)); // Sort descending to remove from end first
    
    if (validIndices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot remove system columns')),
      );
      return;
    }
    
    // Check if we're trying to remove all data columns
    final dataColumnCount = _columns.where((col) => 
      col.field != '_rowCheckbox' && col.field != '_rowNumber'
    ).length;
    
    if (validIndices.length >= dataColumnCount) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot remove all data columns')),
      );
      return;
    }
    
    // Clear state manager BEFORE setState to prevent PlutoGrid from accessing removed columns
    _stateManager = null;
    
    print('Removing ${validIndices.length} columns at indices: $validIndices');
    
    setState(() {
      // Remove columns in reverse order to maintain indices
      for (var index in validIndices) {
        _columns.removeAt(index);
      }
      
      // Rebuild rows to ensure they only contain cells for remaining columns
      // This prevents PlutoGrid from trying to access cells for removed columns
      final updatedRows = _rows.asMap().entries.map((entry) {
        final rowIndex = entry.key;
        final row = entry.value;
        final newCells = <String, PlutoCell>{};
        
        // Recreate all cells for remaining columns to ensure proper initialization
        // This prevents "PlutoCell is not initialized" errors
        for (var col in _columns) {
          if (col.field == '_rowCheckbox') {
            // Checkbox column - handled by PlutoGrid natively
            newCells[col.field] = PlutoCell(value: '');
          } else if (col.field == '_rowNumber') {
            // Set row number with padding
            newCells[col.field] = PlutoCell(value: _addRowNumberPadding('${rowIndex + 1}'));
          } else {
            // For data columns, try to preserve existing value if available
            final existingValue = row.cells.containsKey(col.field) 
                ? row.cells[col.field]?.value ?? '' 
                : '';
            newCells[col.field] = PlutoCell(value: existingValue);
          }
        }
        
        return PlutoRow(cells: newCells);
      }).toList();
      
      _rows = updatedRows;
      
      // Clear selection
      _selectedColumnIndices.clear();
      
      print('Columns after removal: ${_columns.length}, Rows: ${_rows.length}');
    });
  }

  void _renameColumn(int columnIndex) {
    if (columnIndex < 0 || columnIndex >= _columns.length) {
      return;
    }
    
    final column = _columns[columnIndex];
    
    // Don't allow renaming system columns
    if (column.field == '_rowCheckbox' || column.field == '_rowNumber') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot rename system columns')),
      );
      return;
    }
    
    // Get current title without padding
    final currentTitle = column.title.replaceAll(RegExp(r'^[\u2003\s]+'), '');
    
    // Show dialog to rename column
    showDialog(
      context: context,
      builder: (context) {
        final textController = TextEditingController(text: currentTitle);
        return AlertDialog(
          backgroundColor: SciFiTheme.bgSecondary,
          title: const Text(
            'Rename Column',
            style: TextStyle(color: SciFiTheme.neonCyan),
          ),
          content: TextField(
            controller: textController,
            autofocus: true,
            style: const TextStyle(color: SciFiTheme.textPrimary),
            decoration: InputDecoration(
              labelText: 'Column Name',
              labelStyle: const TextStyle(color: SciFiTheme.textSecondary),
              enabledBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: SciFiTheme.borderPrimary),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: SciFiTheme.neonCyan),
              ),
            ),
            onSubmitted: (value) {
              if (value.trim().isNotEmpty) {
                _updateColumnName(columnIndex, value.trim());
                Navigator.of(context).pop();
              }
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'Cancel',
                style: TextStyle(color: SciFiTheme.textSecondary),
              ),
            ),
            TextButton(
              onPressed: () {
                final newName = textController.text.trim();
                if (newName.isNotEmpty) {
                  _updateColumnName(columnIndex, newName);
                  Navigator.of(context).pop();
                }
              },
              child: const Text(
                'Rename',
                style: TextStyle(color: SciFiTheme.neonCyan),
              ),
            ),
          ],
        );
      },
    );
  }

  void _updateColumnName(int columnIndex, String newName) {
    if (columnIndex < 0 || columnIndex >= _columns.length) {
      return;
    }
    
    // Clear state manager to force rebuild
    _stateManager = null;
    
    setState(() {
      final column = _columns[columnIndex];
      // Update title with padding
      column.title = _addTitlePadding(newName);
    });
  }

  void _removeCheckedRows() {
    if (_stateManager == null) return;
    
    // Get checked rows from state manager
    final checkedRows = _stateManager!.checkedRows;
    if (checkedRows.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No rows selected')),
      );
      return;
    }
    
    // Get indices of checked rows (in reverse order to avoid index shifting)
    final checkedIndices = checkedRows
        .map((row) => _rows.indexOf(row))
        .where((index) => index >= 0)
        .toList()
      ..sort((a, b) => b.compareTo(a)); // Sort descending
    
    setState(() {
      // Remove rows in reverse order
      for (var index in checkedIndices) {
        _rows.removeAt(index);
      }
      
      // Renumber remaining rows
      for (var i = 0; i < _rows.length; i++) {
        final rowNumberCell = _rows[i].cells['_rowNumber'];
        if (rowNumberCell != null) {
          rowNumberCell.value = _addRowNumberPadding('${i + 1}');
        }
      }
    });
    
    // Clear checkboxes after removal
    _stateManager!.clearCurrentSelecting();
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

    // Account for checkbox column and row number column widths if present
    for (var col in _columns) {
      if (col.field == '_rowCheckbox' || col.field == '_rowNumber') {
        currentX += col.width;
      } else {
        break; // Stop at first data column
      }
    }

    // Create overlay for each data column's left side (skip checkbox and row number columns)
    int dataColumnStartIndex = 0;
    for (var col in _columns) {
      if (col.field == '_rowCheckbox' || col.field == '_rowNumber') {
        dataColumnStartIndex++;
      } else {
        break;
      }
    }
    
    // Reset currentX for data columns (after system columns)
    double dataColumnX = currentX;
    
    for (int i = dataColumnStartIndex; i < _columns.length; i++) {
      final column = _columns[i];
      final isSelected = _selectedColumnIndices.contains(i);

      // Adjust for scroll offset so overlays move with the grid
      // Ensure we have a valid number (handle NaN/Infinity cases)
      final scrollOffset = _horizontalScrollOffset.isFinite ? _horizontalScrollOffset : 0.0;
      final scrollAdjustedX = (dataColumnX.isFinite ? dataColumnX : 0.0) - scrollOffset;
      // Ensure final value is finite (clamp to reasonable range if needed)
      final finalX = scrollAdjustedX.isFinite ? scrollAdjustedX : 0.0;

      overlays.add(
        Positioned(
          top: 0,
          left: finalX,
          width: leftSideWidth,
          height: headerHeight,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                // Left side clicked - toggle column selection
                setState(() {
                  if (_selectedColumnIndices.contains(i)) {
                    // Already selected - deselect it
                    _selectedColumnIndices.remove(i);
                  } else {
                    // Not selected - select it
                    _selectedColumnIndices.add(i);
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

      dataColumnX += column.width;
    }

    return overlays;
  }

  Widget _buildFilterRowOverlay() {
    // Hide filter cell for checkbox column only
    if (_columns.isEmpty || _stateManager == null || !_stateManager!.showColumnFilter) {
      return const SizedBox.shrink();
    }

    // Find checkbox column
    final checkboxColumn = _columns.firstWhere(
      (col) => col.field == '_rowCheckbox',
      orElse: () => _columns.first,
    );

    if (checkboxColumn.field != '_rowCheckbox') {
      return const SizedBox.shrink();
    }

    const double filterRowHeight = 45.0;
    const double headerHeight = 48.0;
    const double borderWidth = 1.0; // Account for grid borders

    // The checkbox column is the first column, so it's always at position 0 in the grid's content
    // When the grid scrolls horizontally, we need to adjust the overlay position
    // The overlay is positioned relative to the Stack (which is outside the grid's scrollable area)
    // So we need to compensate for the scroll offset
    // Ensure we have a valid number (handle NaN/Infinity cases)
    final scrollOffset = _horizontalScrollOffset.isFinite ? _horizontalScrollOffset : 0.0;
    final calculatedOffset = -scrollOffset + borderWidth;
    final double leftOffset = calculatedOffset.isFinite ? calculatedOffset : borderWidth;

    // Cover only the checkbox column's filter cell
    // Position it to move with the grid's scroll
    return IgnorePointer(
      ignoring: true, // Don't intercept pointer events
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: headerHeight + borderWidth, // Position below header row, accounting for border
            left: leftOffset, // Adjust for scroll offset so overlay moves with checkbox column
            width: checkboxColumn.width - (borderWidth * 2), // Subtract borders on both sides
            height: filterRowHeight - (borderWidth * 2), // Subtract borders on top and bottom
            child: Container(
              color: SciFiTheme.bgTertiary, // Match grid background to hide filter
            ),
          ),
        ],
      ),
    );
  }

  void _detectRowHeights() {
    if (_gridKey.currentContext == null || _rows.isEmpty) return;
    
    final RenderBox? renderBox = _gridKey.currentContext!.findRenderObject() as RenderBox?;
    if (renderBox == null) return;
    
    // Try to find row positions by searching the render tree
    // This is a workaround since PlutoGrid doesn't expose row positions directly
    _updateRowPositions();
    
    setState(() {
      // Use detected values or fall back to defaults
      _actualRowHeight ??= 43.0; // Default row height
      _actualHeaderHeight ??= 48.0; // Default header height
    });
  }

  void _updateRowPositions() {
    // Measure actual row positions by finding the grid's body area
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_gridKey.currentContext == null || _stateManager == null) return;
      
      final RenderBox? gridBox = _gridKey.currentContext!.findRenderObject() as RenderBox?;
      if (gridBox == null) return;
      
      // Try to find the actual row start position by measuring
      // We'll use the state manager's row count and calculate based on
      // the grid's actual rendered height
      final newPositions = <int, double>{};
      
      // Measure the grid's total height and calculate row positions
      final gridHeight = gridBox.size.height;
      
      // Estimate header + filter row height (this is approximate)
      const double estimatedHeaderHeight = 48.0;
      const double estimatedFilterHeight = 45.0;
      final double estimatedBodyStart = estimatedHeaderHeight + estimatedFilterHeight;
      
      // Calculate average row height from remaining space
      final remainingHeight = gridHeight - estimatedBodyStart;
      final averageRowHeight = _rows.isNotEmpty 
          ? remainingHeight / _rows.length 
          : 43.0;
      
      // Calculate positions for each row
      for (int i = 0; i < _rows.length; i++) {
        // Position relative to the Stack (which contains the grid)
        newPositions[i] = estimatedBodyStart + (i * averageRowHeight);
      }
      
      if (mounted) {
        setState(() {
          _rowPositions = newPositions;
          // Also update the detected row height
          _actualRowHeight = averageRowHeight;
        });
      }
    });
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
                    onPressed: _selectedColumnIndices.length == 1 
                        ? () => _renameColumn(_selectedColumnIndices.first)
                        : null,
                    icon: const Icon(Icons.edit, color: SciFiTheme.neonCyan, size: 18),
                    label: const Text(
                      'Rename Column',
                      style: TextStyle(color: SciFiTheme.neonCyan),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedColumnIndices.length == 1 
                          ? SciFiTheme.neonCyan.withOpacity(0.2)
                          : Colors.transparent,
                      side: BorderSide(
                        color: _selectedColumnIndices.length == 1 
                            ? SciFiTheme.neonCyan 
                            : SciFiTheme.borderPrimary,
                        width: _selectedColumnIndices.length == 1 ? 2 : 1,
                      ),
                      shadowColor: SciFiTheme.neonCyan.withOpacity(0.8),
                      elevation: 8,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _selectedColumnIndices.isNotEmpty && _columns.length > 1 
                        ? _removeSelectedColumns 
                        : null,
                    icon: const Icon(Icons.remove, color: SciFiTheme.neonCyan, size: 18),
                    label: Text(
                      _selectedColumnIndices.isNotEmpty 
                          ? 'Remove ${_selectedColumnIndices.length} Column(s)' 
                          : 'Remove Column',
                      style: const TextStyle(color: SciFiTheme.neonCyan),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedColumnIndices.isNotEmpty 
                          ? SciFiTheme.neonCyan.withOpacity(0.2)
                          : Colors.transparent,
                      side: BorderSide(
                        color: _selectedColumnIndices.isNotEmpty 
                            ? SciFiTheme.neonCyan 
                            : SciFiTheme.borderPrimary,
                        width: _selectedColumnIndices.isNotEmpty ? 2 : 1,
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
                    onPressed: _stateManager != null && _rows.isNotEmpty
                        ? _removeCheckedRows
                        : null,
                    icon: const Icon(Icons.remove, color: SciFiTheme.neonCyan, size: 18),
                    label: Text(
                      _stateManager != null && _stateManager!.checkedRows.isNotEmpty
                          ? 'Remove ${_stateManager!.checkedRows.length} Row(s)' 
                          : 'Remove Row',
                      style: const TextStyle(color: SciFiTheme.neonCyan),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _stateManager != null && _stateManager!.checkedRows.isNotEmpty
                          ? SciFiTheme.neonCyan.withOpacity(0.2)
                          : Colors.transparent,
                      side: BorderSide(
                        color: _stateManager != null && _stateManager!.checkedRows.isNotEmpty
                            ? SciFiTheme.neonCyan 
                            : SciFiTheme.borderPrimary,
                        width: _stateManager != null && _stateManager!.checkedRows.isNotEmpty ? 2 : 1,
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
                : NotificationListener<ScrollNotification>(
                    onNotification: (ScrollNotification notification) {
                      // Track horizontal scroll position ONLY
                      // Ignore vertical scroll events (Axis.vertical)
                      if (notification.metrics.axis == Axis.horizontal) {
                        if (notification is ScrollUpdateNotification || notification is ScrollStartNotification) {
                          final pixels = notification.metrics.pixels;
                          // Only update if we have a valid finite number
                          if (pixels.isFinite) {
                            setState(() {
                              _horizontalScrollOffset = pixels;
                            });
                          }
                        }
                      }
                      return false; // Allow the notification to continue bubbling
                    },
                    child: Stack(
                      key: _gridKey, // Keep GlobalKey for position detection
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
                                  
                                  // Try to access scroll controller if available
                                  // Note: PlutoGrid may not expose scroll controller directly
                                  // We'll rely on NotificationListener for scroll tracking
                                  
                                  // Detect actual row positions after grid is loaded and rendered
                                  WidgetsBinding.instance.addPostFrameCallback((_) {
                                    _detectRowHeights();
                                    _updateRowPositions();
                                    // Reset scroll offset on load
                                    _horizontalScrollOffset = 0.0;
                                  });
                                },
                                onSelected: (PlutoGridOnSelectedEvent event) {
                                  // Handle cell selection
                                  if (event.cell != null) {
                                    final column = event.cell!.column;
                                    
                                    // Skip checkbox and row number columns (native checkboxes handle row selection)
                                    if (column.field != '_rowCheckbox' && column.field != '_rowNumber') {
                                      // Data column clicked - toggle column selection for removal
                                      final columnIndex = _columns.indexOf(column);
                                      if (columnIndex >= 0) {
                                        setState(() {
                                          if (_selectedColumnIndices.contains(columnIndex)) {
                                            // Already selected - deselect it
                                            _selectedColumnIndices.remove(columnIndex);
                                          } else {
                                            // Not selected - select it
                                            _selectedColumnIndices.add(columnIndex);
                                          }
                                        });
                                      }
                                    }
                                  }
                                },
                                onSorted: (PlutoGridOnSortedEvent event) {
                                  // Column sorting occurred (right-side header click handled by PlutoGrid)
                                },
                                onRowChecked: (PlutoGridOnRowCheckedEvent event) {
                                  // Native row checkbox toggled - update UI to reflect checked state
                                  setState(() {
                                    // Trigger rebuild to update remove button state
                                  });
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
                                    // Ensure columns maintain their specified widths
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
                                    isAlwaysShown: true, // Show scrollbar for better UX with many columns
                                  ),
                                ),
                              ),
                        // Custom header overlay for left/right click detection
                        _buildCustomHeaderOverlay(),
                        // Overlay to hide filter cells for checkbox and row number columns
                        _buildFilterRowOverlay(),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
