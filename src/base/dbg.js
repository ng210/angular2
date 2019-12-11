(function() {
	try {
	var Dbg = {
		con: null,
		clicked: false,
		init: function(lbl) {
			this.con = document.getElementById(lbl);
			this.con.onmouseover = e => this.con.style.opacity = this.clicked ? 0.5 : 0.2;
			this.con.onmouseout = e => { this.clicked = false; this.con.style.opacity = 0.01; }
			this.con.onclick = e => { this.clicked = true; this.con.style.opacity = 0.5; };
			this.con.style.opacity = 0.02;
			this.con.style.zIndex = 100;
			this.con.style.width = window.innerWidth;
		},
		prln: function(txt) {
			this.pr(txt.toString().replace(/\n/g, "<br/>") + '<br/>');
		},
		pr: function(txt) {
			if (this.con != null) {
				this.con.innerHTML += txt || '';
			} else {
				console.debug(txt);
			}
		},
		measure: function(fn, lbl) {
			var ti = new Date().getTime();
			for (var i=0; i<10000; i++) {
				fn();
			}
			ti = new Date().getTime() - ti;
			this.prln(lbl + ': ' + ti);
		}
	};
	public(Dbg, 'Dbg');
	
	} catch (error) {
		alert(error.message + '\n' + error.stack);
	}

})();
