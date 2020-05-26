include('repo-item.js');
// ********************************************************************************************
//
// Pass
//
// ********************************************************************************************
(function() {
	function Pass(type, selectors, target) {
		this.type = type || Pass.Types.Opaque;
		this.selectors = selectors || {};			// select by mesh attributes
		this.target = target || 0;					// target of rendering, 0 = draw buffer
	}

	Pass.Types = {
		"Opaque": 0,
		"Transluscent": 1,
		"Transparent": 2
    };
    
    public(Pass, 'Pass', webGL);
})();
