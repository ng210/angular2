(function() {
	try {
	var Dbg = {
		con: null,
		clicked: false,
		init: function(lbl) {
			this.con = document.getElementById(lbl);
			this.con.onmouseout = e => Dbg.mouseOver = false;
			this.con.onclick = e => {
				this.clicked = true;
				this.con.style.opacity = 0.75;
			};
			this.con.style.opacity = 0.02;
			this.con.style.zIndex = 100;
			//this.con.style.width = window.clientWidth;
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

	Dbg.con_onmouseover = function(e) {
		var node = e.target;
		while (node) {
			if (node == Dbg.con) {
				Dbg.mouseOver = true;
			}
			node = node.parentNode;
		}
		Dbg.con.style.opacity = Dbg.mouseOver ? (Dbg.clicked ? 0.75 : 0.5) : 0.2;
	};

	public(Dbg, 'Dbg');
	
	} catch (error) {
		alert(error.message + '\n' + error.stack);
	}

	document.addEventListener('mouseover', Dbg.con_onmouseover);

})();
