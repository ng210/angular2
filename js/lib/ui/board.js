include('container.js');

// unstructured container of controls
(function() {
	function Board(id, template, parent) {
		Ui.Container.call(this, id, template, parent);
	};
	extend(Ui.Container, Board);

	Ui.Control.Types['board'] = { ctor: Board, tag: 'DIV' };
	Board.prototype.getTemplate = function() {
		var template = Board.base.getTemplate.call(this);
		template.type = 'board';
		return template;
	};
	Board.prototype.dataBind = function(dataSource, dataField) {
		Board.base.dataBind.call(this, dataSource, dataField);
		for (var i=0; i<this.itemOrder.length; i++) {
			var item = this.items[this.itemOrder[i]];
			var ds = item.dataSource || dataSource || this.dataSource;
			if (ds && item.dataField) {
				item.dataBind(ds, item.dataField);
			}
		}
	};

	Ui.Board = Board;
})();