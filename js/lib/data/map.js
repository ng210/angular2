(function(){
	var map = function() {
		Object.apply(this.arguments);
		this.keys = [];
		this.length = 0;
	};
	map.prototype = new Object;
	map.prototype.getClass = function() {
		return 'map';
	};
	map.prototype.compareTo = function(arr) {
		var res = this.length - arr.length;
	};
	map.prototype.apply = function(callback, args, filter) {
		var ret = -1;
		var i = 0;
		for (var k in this) {
			var item = this[k];
			if (typeof filter !== 'function' || !filter.call(this, i, args)) {
				if (callback.call(this, i, args)) {
					ret = i;
					break;
				}
			}
			i++;
		}
		return ret;
	};
	map.prototype.containsKey = function(k) {
		return Object.keys(this).indexOf(k) !== -1;
	};
	map.prototype.clone = function() {
		var clone = new this.constructor();
		for (var k in this) {
			var item = this[k];
			clone[k] = typeof item.clone === 'function' ? item.clone() : item.valueOf;
		}
		return clone;
	};

	module.exports=map;
})();

Map.prototype.add = function(k, v, p)
{
	if (this._keys.indexOf(k) == -1)
	{
		p = p || this._keys.length;
		// insert new item into key array
		this._keys.splice(p, 0, k);
		this[k] = v;
		this.length++;
		return true;
	}
	return false;
};

/*******************************************************************************
 * Apply callback function on each element that pass the filter.
 * Arguments 
 * 	fCallback: function called on each element.
* 		Type of function is [bool Object::Function(sKey, oArgs)]
 * 	oArgs: additional arguments for the callback
 * 	fFilter: returns true if element matches filter criteria.
 * 		Type of function is [bool Object::Function(sKey, oArgs)]
 * Returns
 * 	index of last element if callback returned false - break iteration
 * 	otherwise -1  
 ******************************************************************************/
Map.prototype.apply = function(fCallback, oArgs, fFilter)
{
	for (var i=0; i<this._keys.length; i++)
	{
		var key = this._keys[i];
		if (!fFilter || !fFilter.call(this, key, oArgs))
		{
			if (!fCallback.call(this, key, oArgs))
				return i;
		}
	}
	return -1;
};

/*******************************************************************************
 * Clear map.
 ******************************************************************************/
Map.prototype.clear = function()
{
	throw 'Not Implemented';
};
/*******************************************************************************
 * Checks whether an item is stored in the map and returns its ordinal index.
 * Arguments
 * 	oItem: item to search
 * Returns
 *  n: ordinal of stored item
 *  -1: item is not stored
 ******************************************************************************/
Map.prototype.indexOf = function(oItem)
{
	var ix = -1;
	for (var k=0; k<this._keys.length; k++)
	{
		if (oItem.compareTo(this[this._key[k]]) == 0)
		{
			ix = k;
			break;
		}
	}
	return ix;
}
/*******************************************************************************
 * Checks whether a key exists in the map.
 * Arguments
 * 	sKey: key to search
 * Returns
 *  true: key exists
 *  false: key not found
 ******************************************************************************/
Map.prototype.containsKey = function(sKey)
{
	return this[sKey] != undefined;
}
/*******************************************************************************
 * Return item at given index.
 * Arguments
 * 	index: index of item
 * Returns
 *  item if found
 *  undefined if not found
 ******************************************************************************/ 
Map.prototype.getAt = function(index)
{
	var obj = null;
	if (index < this._keys.length)
	{
		var key = this._keys[index];
		obj = this[key];
	}
	return obj;
}

/*******************************************************************************
 * Remove item.
 * Arguments
 * 	item: item to remove
 * Returns
 *  true if item was removed
 *  false if item not found (thus not removed)
 ******************************************************************************/
Map.prototype.remove = function(sKey)
{
	var ix = this._keys.indexOf(sKey);
	return this.removeAt(ix);
};

/*******************************************************************************
 * Remove item at index.
 * Arguments
 * 	ix: index to remove item at
 * Returns
 *  true if item was removed
 *  false if item not found (thus not removed)
 ******************************************************************************/
Map.prototype.removeAt = function(ix)
{
	var obj = null;
	if (this._keys.length < ix)
	{
		var sKey = this._keys[ix];
		if (ix != -1)
		{
			obj = this._keys.splice(ix, 1);
			delete this[sKey];
		}		
	}
	return obj;
};

/*******************************************************************************
 * Sort map items by key.
 * Arguments
 * 	fCompare: comparator function, method of elements in the array.
 * 		Type of function is [bool oItem::Function(oItem)].
 * 		If current object is smaller than oItem the returned value is negative.
 * 		If current object is equal to oItem the returned value is zero.
 * 		If current object is greater than oItem the returned value is positive.  
 * Returns
 ******************************************************************************/
Map.prototype.sort = function(fCompare)
{
	this._keys.sort(fCompare);
};

Map.fromObject = function(obj)
{
	var map = new Map();
	obj.apply(
		function(i, args)
		{
			var v = this[i];
			if (typeof this[i] === 'object')
			{
				v = Map.fromObject(this[i]);
			}
			map.add(i, v);
			return true;
		},
		null,
		function(i, args)
		{
			return i == '_hashCode';
		}
	);
	return map;
};
