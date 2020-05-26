(function() {

    function AboutDialog() {
        Ui.Dialog.call(this, 'AboutDialog', 
        {
            "titlebar": "About",
            "css": "dialog about",
            "items": {
                "icon": { "type": "label", "value": "" },
                "text": { "type": "label", "css": "text", "value": "Hello" }
            }
        });
    }
    extend(Ui.Dialog, AboutDialog);

    AboutDialog.prototype.onclick = function(e) {
        if (e.control.value == 'Ok') this.close();
    }

    public(AboutDialog, 'Constructor');

})();