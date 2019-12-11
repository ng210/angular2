var _mainTimer = null;
var _primary = null;
var _secondary = null;
var _width = 0;
var _height = 0;
var _dots = [];
var _activeDotCount = 0;
var c = 0;
var _maxDotCount = 1000;

var _delta = 40;		// msecs
var _duration = 500;	// msecs
var _offsX = 0;
var _offsY = 0;

var velocity = 1.5;
var variance = 0.1;
var length = 0.8;
var smoothness = 0.1;

var _img = null;
var _imgCanvasCtx = null;
var _frame = 0;
var _endFrame = 0;

var _texts = [
	'Helló világ!',
	'Ez egy effekt',
	'JavaScriptben.'
];
var _textIx = 0;

/*****************************************************************************/
function createText(text)
{
	var width = _primary.canvas.width;
	var height = 56;
	var fontHeight = Math.floor(0.9*height);
	var imgCanvas = document.createElement('canvas');
	imgCanvas.width = width;
	imgCanvas.height = height;
	var imgCanvasCtx = imgCanvas.getContext('2d');
	imgCanvasCtx.font="bold "+fontHeight+"px Arial";
	width = imgCanvas.width = imgCanvasCtx.measureText(text).width;
	imgCanvasCtx.clearRect(0,0, width, height);
	imgCanvasCtx.font="bold "+fontHeight+"px Arial";
	imgCanvasCtx.textBaseline = "middle";
	//imgCanvasCtx.clearRect(0,0, width,height);
	imgCanvasCtx.fillStyle = "rgba(255,255,255,255)";
	imgCanvasCtx.fillText(text,0,height/2);
	return imgCanvasCtx.getImageData(0, 0, width, height);
}

/*****************************************************************************/
function init()
{
	// create primary surface
	_primary = document.getElementById('primary').getContext('2d');
	// create secondary surface
	var backbuffer = document.createElement('canvas');
	_width = backbuffer.width = _primary.canvas.width;
	_height = backbuffer.height = _primary.canvas.height;
	_secondary = backbuffer.getContext('2d');
	//loadImage(fileName, prepareImage);
	restart();
}
/*****************************************************************************/
function restart()
{
	var el = document.getElementById('text');
	var txt = el.value;
	if (txt == '')
	{
		el.value = txt = 'Hello World!';
	}
	//_dots = [];
	_frame = 0;
	clearTimeout(_mainTimer);
	var data = createText(_texts[_textIx]);
	_textIx = (_textIx+1)%_texts.length;
	_offsX = Math.floor(Math.random()*(_width - data.width));
	_offsY = Math.floor(Math.random()*(_height - data.height)); 
	createDots(data);
	_secondary.clearRect(0,0,_width, _height);
	
	mainloop();
}

/*****************************************************************************/
function createDots(imgData)
{
	var ix = 0, k = 0;
	for (var j=0; j<imgData.height;j++)
	{
		for (var i=0; i<imgData.width;i++)
		{
			// check alpha
			var color =
			[
				Math.floor(imgData.data[ix+0]*(0.1+Math.random()*0.9)),
				Math.floor(imgData.data[ix+1]*(0.1+Math.random()*0.9)),
				Math.floor(imgData.data[ix+2]*(0.1+Math.random()*0.9)),
				imgData.data[ix+3]
			];
			if (color[3] > 0)
			{
				var x = Math.floor(Math.random()*_width);
				var y = Math.floor(Math.random()*_height);
				var tx = _offsX+i;
				var ty = _offsY+j;
				var sk = Math.floor(k/10);
				var frames = Math.floor(0.5*_duration/_delta*(1 + Math.random()));
				if (k < _dots.length)
				{
					_dots[k].sx = _dots[k].tx;
					_dots[k].sy = _dots[k].ty;
					_dots[k].tx = tx;
					_dots[k].ty = ty;
					_dots[k].color = color;
					_dots[k].frames = frames;
					_dots[k].alpha = color[3];
					_dots[k].dt = sk;
				}
				else
				{
					_dots.push({tx:tx, ty:ty, cx:0, cy:0, sx:x, sy:y, dt:sk, alpha:color[3], color:color, frames:frames});
				}
				k++;
			}
			ix += 4;
		}
	}
	for (var i=k-1; k<_activeDotCount; k++)
	{
		_dots[k].sx = _dots[i].sx;
		_dots[k].sy = _dots[i].sy;
		_dots[k].tx = _dots[i].tx;
		_dots[k].ty = _dots[i].ty;
		_dots[k].frames = _dots[i].frames;
	}
	_activeDotCount = k;
}

/*****************************************************************************/
function update(frame)
{
	_deadDotCount = 0;
	for (var i=0; i<_activeDotCount; i++)
	{
		if (frame <= _dots[i].frames)
		{
			//if (frame < _dots[i].dt) continue;
			var f = Math.sin(Math.PI/2*frame/_dots[i].frames);
/*
			var dx = _dots[i].cx - _dots[i].tx;
			var dy = _dots[i].cy - _dots[i].ty;
			var d = Math.sqrt(dx*dx + dy*dy);
			var f = 0.2*d;
*/
			_dots[i].cx = Math.floor(_dots[i].sx + (_dots[i].tx-_dots[i].sx) * f);
			_dots[i].cy = Math.floor(_dots[i].sy + (_dots[i].ty-_dots[i].sy) * f);
			//_dots[i].alpha = Math.floor(_dots[i].color[3]*Math.sin(Math.PI/2*frame/_dots[i].frames));
		}
		else
		{
			_deadDotCount++;
		}
	}
	return _activeDotCount > _deadDotCount;
}
/*****************************************************************************/
function render()
{
	_secondary.globalCompositeOperation = 'copy';
	_secondary.globalAlpha = 0.75;
	_secondary.drawImage(_primary.canvas, 0,0, _width, _height);
	//_primary.fillStyle = 'white';
	//_primary.fillRect(0,0,_width,_height);
	var imgData = _secondary.getImageData(0, 0, _width, _height);
	for (var i=0; i<_activeDotCount; i++)
	{
		var ix = (_dots[i].cx + _dots[i].cy*_width)<<2;
		for (var k=0; k<3; k++)
		{
			imgData.data[ix+k] = _dots[i].color[k];
		}
		imgData.data[ix+3] = _dots[i].alpha;
	}
	_secondary.putImageData(imgData, 0,0);
	_primary.fillStyle = 'rgba(0,0,0,255)';
	_primary.fillRect(0,0,_width,_height);
	_primary.globalCompositeOperation = 'source-over';
	_primary.globalAlpha = 1.0;
	_primary.drawImage(_secondary.canvas, 0,0, _width, _height);
}
/*****************************************************************************/
function mainloop()
{
	clearTimeout(_mainTimer);
	if (!update(_frame))
	{
		if (_endFrame == 0)
		{
			_mainTimer = setTimeout(restart, 500);
			return;
		}
		_endFrame--;
	}
	else
	{
		_endFrame = 1000/_delta;
	}
	render(_frame);
	_frame++;
	_mainTimer = setTimeout(mainloop, _delta);
}
