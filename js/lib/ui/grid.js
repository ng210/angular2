include('container.js');
// strict structure of controls based on rows and columns
// templates for rows or for cells
(function() {
	function Grid(id, template, parent) {
		Ui.Control.call(this, id, template, parent);
		this.table = null;
		// set rows/columns array
		this.rowKeys = null;
		this.rows = null;
		this.rowCount = parseInt(this.template.rows);
		this.columnKeys = null;
		this.columns = null;
		this.columnCount = parseInt(this.template.cols);
		// set templates
		this.rowTemplate = this.template['row-template'];
		this.cellTemplate = this.template['cell-template'];
	};
	extend(Ui.Control, Grid);
	Ui.Control.Types['grid'] = { ctor: Grid, tag: 'DIV' };

	Grid.prototype.getTemplate = function() {
		var template = Grid.base.getTemplate.call(this);
		template.titlebar = this.id;
		template.rows = '0';
		template.cols = '0';
		template.header = true;
		template['row-template'] = null;
		template['cell-template'] = null;
		return template;
	};

	Grid.prototype.buildRow = function(row, src, rowTmpl) {
		// build a row from the given data source
		// using the selected template
		var ri = row.id;
		for (var ci=0; ci<this.columnKeys.length; ci++) {
			var key = this.columnKeys[ci];
			var column = this.columns[key];
			var tmpl = rowTmpl[key];
			var dataField = tmpl['data-field'] || key;
			var cell = Ui.Control.create(this.id + '#' + ri + '#' + ci, tmpl, row);
			if (tmpl.label === true) {
				cell.label = row.name + '.' + key;
			}
			src = cell.dataBind(src, dataField);
			cell.row = row; cell.column = column;
			row.cells[ci] = row.cells[key] = cell;
			column.cells.push(cell);
		}
		return row;
	};
	Grid.prototype.updateColumnCountFromDataSource = function(src) {
		// The count of columns/cells is defined by columnCount (or maximum count of items in the data source)
		for (var i in src) {
			if (src.hasOwnProperty(i)) {
				var rowItem = src[i];
				if (!Array.isArray(rowItem) && typeof rowItem !== 'object') {
					throw new Error('Invalid item at row ' +  i + '! It has to be an enumerable.');
				}
				var count = Object.keys(rowItem);
				if (count > this.columnCount) {
					this.columnCount = count;
				}
			}
		}
	};
	Grid.prototype.build = function() {
		var src = this.dataField ? this.dataSource.obj[this.dataField] : this.dataSource;
		// get or create row template
		var rowTemplate = this.rowTemplate;
		this.rows = {};
		this.rowKeys = Object.keys(src);
		this.columns = {};
		if (rowTemplate == null) {
			// create row template based on cell templates
			this.updateColumnCountFromDataSource(src);
			if (this.columnCount == 0 || this.cellTemplate == null) {
				throw new Error('When not providing a row-template, the attributes \'cols\' and \'cell-template\' have to be present!');
			}
			// create columns, build row template
			this.columnKeys = [];
			rowTemplate = [];
			for (var ci=0; ci<this.columnCount; ci++) {
				// column keys are the ordinals
				this.columnKeys[ci] = ci+'';
				rowTemplate[ci] = this.cellTemplate;
				this.columns[ci] = {id:ci, name:ci, cells:[], parent:this};
			}
		} else {
			// create columns, the keys of columns are defined by the first row in the data source
			this.columnKeys = Object.keys(rowTemplate);
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				var key = this.columnKeys[ci]
				this.columns[key] = this.columns[ci] = {id:ci, name:key, cells:[], parent:this};
			}
			this.columnCount = this.columnKeys.length;
		}
		// create rows and cells
		var headKey = '__head';
		if (this.template.header) {
			this.rowKeys.unshift(headKey);
			var row = { id: '00', name: headKey, cells:{}, parent: this };
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				var key = this.columnKeys[ci];
				var column = this.columns[key];
				var cell = Ui.Control.create(this.id + '#00' + '#' + ci, {'type':'label', 'label':false}, row);
				cell.setValue(Grid.decodeText(rowTemplate[key].column, key));
				cell.row = row; cell.column = column;
				row.cells[ci] = row.cells[key] = cell;
				//column.cells.push(cell);
			}
			this.rows[headKey] = row;
		}

		for (var ri=0; ri<this.rowKeys.length; ri++) {
			var rowKey = this.rowKeys[ri];
			if (rowKey == headKey) continue;
			var srcRow = src[rowKey];
			var row = { id: ri+1, name: rowKey, cells:{}, parent: this };
			this.buildRow(row, srcRow, rowTemplate);
			this.rows[rowKey] = row;
		}
		//Ui.Control.registerHandler.call(this);
	};
	Grid.prototype.dataBind = function(obj, field) {
		//var dataLink = Grid.base.dataBind.call(this, obj, field);
		var dataSource = field ? obj[field] : obj;
		if (this.dataSource != dataSource) {
			this.dataSource = dataSource;
			this.build();
		}
		return this.dataSource;
	};
	Grid.prototype.getCell = function(ri, ci) {
		if (typeof ri === 'string') {
			var tokens = ri.split('#');
			ri = tokens[0];
			ci = tokens[1];
		}
		var row = this.rows[ri];
		return row ? row.cells[ci] : null;
	};
	Grid.prototype.render = async function(ctx) {
		Grid.base.render.call(this, ctx);
		if (!this.table) {
			this.table = document.createElement('TABLE');
			this.table.className = this.parent.cssText + 'grid table';
			this.table.setAttribute('cellpadding', 0);
			this.table.setAttribute('cellspacing', 0);
			this.element.appendChild(this.table);
		}
		// add new rows
		var oldRowCount = this.table.rows.length;
		if (!this.rowKeys) return;
		for (var ri=oldRowCount; ri<this.rowKeys.length; ri++) {
			var rowKey = this.rowKeys[ri];
			var row = this.rows[rowKey];
			var tr = document.createElement('TR');
			var rowClass = rowKey != '__head' ? ri % 2 ? 'r0' : 'r1' : 'head';
			tr.className = this.parent.cssText + 'grid row ' + rowClass;
			row.element = tr;
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				var key = this.columnKeys[ci];
				var td = document.createElement('TD');
				// var cellClass = rowClass + ' ' + (ci % 2 ? 'c0' : 'c1');
				// td.className = 'grid cell ' + cellClass;
				var cell = row.cells[ci];
				td.control = cell;
				var tmplLabel = cell.template.label;
				// tmplLabel=true => cell.label = calculated value
				// tmplLabel=string => cell.label = tmplLabel
				// tmplLabel="$key" => cell.label = key
				cell.label = Grid.decodeText(tmplLabel, key);
				/* else if (tmplLabel === true) {
					label = cell.label;
				}*/
				cell.render({'element': td});
				td.appendChild(cell.element);
				tr.appendChild(td);
			}
			this.table.appendChild(tr);
		}
		// remove rows
		for (var ri=this.rows.length; ri<oldRowCount; ri++) {
			// remove rows[ri];
		}
		this.refresh();
	};
	Grid.prototype.refresh = function() {
		var src = this.dataField ? this.dataSource.obj[this.dataField] : this.dataSource;
		this.rowKeys = Object.keys(src);
		for (var ri=0; ri<this.rowKeys.length; ri++) {
			// repaint every row
			var rowKey = this.rowKeys[ri];
			var row = this.rows[this.rowKeys[ri]];
			var rowClass = rowKey != '__head' ? ri % 2 ? 'r0' : 'r1' : 'head';
			row.element.className = 'grid row ' + rowClass;
			var cssText = `${this.parent.cssText}grid cell`;
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				// repaint every cell
				var key = this.columnKeys[ci];
				var cellClass = `${cssText} ${rowClass} ${ci % 2 ? 'c0' : 'c1'} ${key}`;
				var cell = row.cells[ci];
				var td = cell.element.parentNode;
				td.className = cellClass;
				// var tmplLabel = cell.template.label;
				// cell.label = Grid.decodeText(tmplLabel, key);
				// tmplLabel=true => cell.label = calculated value
				// tmplLabel=string => cell.label = tmplLabel
				// tmplLabel="$key" => cell.label = key

				// if (typeof tmplLabel === 'string') {
				// 	if (tmplLabel == '$key') {
				// 		cell.label = key;
				// 	} else if (tmplLabel === '$Key') {
				// 		cell.label = key.charAt(0).toUpperCase() + key.substring(1);
				// 	} else {
				// 		cell.label = tmplLabel;
				// 	}
				// } else if (tmplLabel === false) {
				// 	label = '';
				// }/* else if (tmplLabel === true) {
				// 	label = cell.label;
				// }*/
				//cell.css.push('grid', 'cell');
				//cell.css.push(...this.parent.css, 'grid', 'cell', cellClass);
				cell.render({'element': td});
				cell.element.className = cellClass;
			}
		}
	};
	// Grid.prototype.registerHandler = function(event) {
	// 	if (['click', 'mouseover', 'mouseout'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
	// 	Ui.Control.registerHandler.call(this, event);
	// };
	Grid.decodeText = function(text, key) {
		var result = text;
		if (typeof text === 'string') {
			if (text == '$key') {
				result = key.charAt(0).toLowerCase() + key.substring(1);
			} else if (text === '$Key') {
				result = key.charAt(0).toUpperCase() + key.substring(1);
			}
		}
		return result;
	}
	Ui.Grid = Grid;

})();

