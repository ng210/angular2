include('/lib/ui/multichart.js');

(function() {
    
    function NoteChart(id, template, parent) {
        Ui.MultiChart.call(this, id, template, parent);
    };
    extend(Ui.MultiChart, NoteChart);

    Ui.MultiChart.RenderModes['bar2'].shader = 'note';
    Ui.Control.Types['notechart'] = { ctor: NoteChart, tag: 'DIV' };

    NoteChart.prototype.getTemplate = function() {
        var template = NoteChart.base.getTemplate.call(this);
        template.type = 'notechart';
        template.unit = [20.0, 8.0];
        template['grid-color'] = [0.5, 0.5, 0.5];
        template.color = [1.0, 1.0, 0.5];
        template['render-mode'] = 'bar2';
        return template;
    };

    NoteChart.prototype.onSet = function(from, to) {
        var dx = Math.abs(to[0] - from[0]) + 1;
        var dy = Math.abs(to[1] - from[1]) + 1;
        var velocity = Math.floor(255 * dy * this.uniforms.uUnit.value[1]/this.uniforms.uSize.value[1]);
        var note = [from[0], from[1], velocity, dx];
        this.series.set(note);
    };

    Ui.NoteChart = NoteChart;

})();