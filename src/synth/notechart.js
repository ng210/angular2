include('/ui/multichart.js');
include('/webgl/webgl.js');

(function() {
    NoteChart = function(id, template, parent) {
        Ui.MultiChart.call(this, id, template, parent, 'notes.fs');

        this.constructor = this;
    };

    NoteChart.prototype = new Ui.MultiChart();


    public(NoteChart, 'NoteChart');
})();