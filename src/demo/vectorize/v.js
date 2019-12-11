	var _settings = {
		width: 400,
		height: 300,
		fps: 30,

		delay: 0.0
	};

	var _root = null;
	
//******************************************************************************
	Array.prototype.apply = function(f, args)
	{
		for (var i=0; i<this.length; i++)
		{
			if (this[i] != null)
				f.apply(this[i], args);
		}
	}
//******************************************************************************
function init()
{
	Demo.init(_settings);
	$('title').innerHTML = 'Vectorize';
	$('RestartBtn').setAttribute('disabled', true);
	initHTML5();
	GE.startStop();
}
//******************************************************************************
function initHTML5()
{
	GE.front.setAttribute('width',_settings.width);
	GE.front.setAttribute('height',_settings.height);
	GE.back.setAttribute('width',_settings.width);
	GE.back.setAttribute('height',_settings.height);

	// GE.resize()...
	GE.front.offsetPos = null;
	HTML.applyStyle(GE.front, 'border:none;backgroundColor:black');
	HTML.applyStyle(GE.back, 'border:none;backgroundColor:black');
}
//******************************************************************************
function applySetting(obj)
{
	switch (obj.id)
	{
		case 'width':
		case 'height':
			_settings[obj.id] = parseInt(obj.value);
			initHTML5();
			break;
		case 'fps':
			GE.fps = parseFloat(obj.value);
			GE.stop();
			GE.start();
			break;
		case 'tolerance':
			var t = parseFloat(obj.value);
			_settings[obj.id] = t;
			break;
		default:
			_settings[obj.id] = parseFloat(obj.value);
			break;
	}
}
//******************************************************************************
function addPoint(x, y)
{
	var point = {x:x, y:y};
	var newNode = new Node(point);
	if (_root != null)
	{
		// get nearest point
		_min = 100000;
		_root.flags++;
		_root.DFS(_root, distanceToPoint, point);
		// insert new point
		_nearestNode.addLink(newNode);
	}
	else
	{
		_root = newNode;
	}
}

//******************************************************************************
function processInput()
{
	var offset = GE.offset();
	if (GE.inputs.mlb == 1 && _mlb != 1)
	{
		var x = GE.inputs.pos[0] - offset[0];
		var y = GE.inputs.pos[1] - offset[1];
		if (x >= 0 && x < GE.front.width &&
			y >= 0 && y < GE.front.height)
		{
			addPoint(x, y);
		}
	}
	_mlb = GE.inputs.mlb;
}

//******************************************************************************
function restart()
{
	;
}
//******************************************************************************
function update(frame)
{
	var delay = _settings.delay*_settings.fps;
	if ((frame % delay) == 0)
	{
		var x = Math.floor(Math.random()*GE.front.width);
		var y = Math.floor(Math.random()*GE.front.height);
		addPoint(x, y);
	}
}
//******************************************************************************
function render(frame)
{
	if (_root)
	{
		GE.backContext.clearRect(0,0, GE.front.width, GE.front.height);
		_root.flags = frame;
		_root.DFS(_root, renderNode);
		GE.frontContext.drawImage(GE.back, 0,0);
	}
}
//******************************************************************************
function renderNode(node)
{
	var ctx = GE.backContext;
	ctx.beginPath();
	ctx.lineJoin = 'round';
	
	if (node != null)
	{
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 1;
		ctx.moveTo(this.data.x, this.data.y);
		ctx.lineTo(node.data.x, node.data.y);
		ctx.stroke();
	}
	//ctx.lineWidth = 2;
	ctx.fillStyle = 'red';
	ctx.fillRect(this.data.x-2, this.data.y-2, 6,6);

	return true;
}
//******************************************************************************
var _nearestNode = null;
var _min = 0;
function distanceToPoint(node, point)
{
	var dx = this.data.x - point.x;
	var dy = this.data.y - point.y;
	var d = Math.sqrt(dx*dx + dy*dy);
	if (d < _min)
	{
		_nearestNode = this;
		_min = d;
	}
	return true;
}
//******************************************************************************
function distanceToSection(node, point)
{
	var dx = this.data.x - point.x;
	var dy = this.data.y - point.y;
	var d = Math.sqrt(dx*dx + dy*dy);
	if (d < _min)
	{
		_nearestNode = this;
		_min = d;
	}
	return true;
}