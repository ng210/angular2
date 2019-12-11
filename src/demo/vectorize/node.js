function NodeBase()
{
	//**************************************************************************
	this.addLink = function(node)
	{
		// bi-directional linking
		this.links.push(node);
		node.links.push(this);
	};
	this.split = function(newNode, oldNode)
	{
		// look for the original destination
		for (var i=0; i<this.links.length; i++)
		{
			// node found
			if (this.links[i] == oldNode)
			{
				// new node links to this
				newNode.links.push(this);
				// and to original destination
				newNode.links.push(node2);
				break;
			}
		}
	}
	this.merge = function()
	{
		;
	};
	//**************************************************************************
	this.DFS = function(node, callback, args)
	{
		// set node to visited
		this.flags = node.flags;
		// do action at node
		if (callback.call(this, node, args) == false)
		{
			return this;
		}
		// traverse all links (edges)
		for (var i=0; i<this.links.length; i++)
		{
			// node visited already?
			if (this.links[i].flags != node.flags)
			{
				// recursive call
				this.links[i].DFS(this, callback, args);
			}
		}
		
	};
	//**************************************************************************
	this.BFS = function(node, callback, args)
	{
		// set node to visited
		this.flags = node.flags;
		// do action at node
		if (callback.call(this, node, args) == false)
		{
			return this;
		}
		// traverse all links (edges)
		for (var i=0; i<this.links.length; i++)
		{
			// node visited already?
			if (this.links[i].flags != node.flags)
			{
				// recursive call
				this.links[i].DFS(this, callback, args);
			}
		}
		
	};
}
//******************************************************************************
function Node(data)
{
	this.data = data;
	this.links = [];
	this.flags = 0;
}

Node.prototype = new NodeBase;