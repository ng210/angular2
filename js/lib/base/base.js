var DBGLVL = 0;

/******************************************************************************
 * AJAX
 ******************************************************************************/
var ajax = {
    ExtToMimeTypeResponseTypeMap: {
        'css':   { mimeType: 'text/css', responseType: 'text', charSet: 'utf-8' },
        'js':    { mimeType: 'text/javascript', responseType: 'text', charSet: 'utf-8' },
        'html':  { mimeType: 'text/html', responseType: 'document', charSet: 'utf-8' },
        'xml':   { mimeType: 'text/xml', responseType: 'document', charSet: 'utf-8' },
        'glsl':  { mimeType: 'x-shader/*', responseType: 'text', charSet: 'utf-8' },
        'gif':   { mimeType: 'image/gif', responseType: 'blob', charSet: 'binary' },
        'bmp':   { mimeType: 'image/bmp', responseType: 'blob', charSet: 'binary' },
        'jpg':   { mimeType: 'image/jpg', responseType: 'blob', charSet: 'binary' },
        'png':   { mimeType: 'image/png', responseType: 'blob', charSet: 'binary' },
        'json':  { mimeType: 'text/json', responseType: 'json', charSet: 'utf-8' },
    },
    getTypeByExtension: function(url) {
        var m = url.match(/[^\\\/\.]+\.([^.]+)$/);
        var ext = m ? m[1].toLowerCase() : '';
        var type = ajax.ExtToMimeTypeResponseTypeMap[ext] || { mimeType: 'text/plain', responseType: 'text', charSet: 'utf-8'};
        return type;
    },
    createXhr: function(options) {
        // create XHR object
        var xhr = null;
        if (window.XMLHttpRequest !== undefined) {
            xhr = new XMLHttpRequest();
        } else {
            if (window.ActiveXObject !== undefined) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            } else {
                throw new Error('Could not create XmlHttpRequest object!');
            }
        }
        // get URL
        var url = new Url(options.url);
        // open XHR connection
        options.resolvedUrl = url.toString();
        xhr.open(options.method.toUpperCase(), options.resolvedUrl, options.async);
        xhr.error = null;
        xhr.options = options;
        // set content and response types
        var type = ajax.getTypeByExtension(options.url);
        options.contentType = options.contentType || type.mimeType;
        options.responseType = options.responseType || type.responseType;
        options.charSet = options.charSet || type.charSet;
        xhr.responseType = options.responseType;
        xhr.setRequestHeader('Content-Type', options.contentType + '; charset=' + options.charSet);
        xhr.overrideMimeType(options.contentType + '; charset=' + options.charSet);
        return xhr;
    },
    /******************************************************************************
    * Send data to server and read response.
    * Options:
    * - url*
    * - data
    * - method
    * - contentType
    * - responseType
    * - charSet
    ******************************************************************************/
    send: function(options) {
        if (options.async === undefined) {
            options.async = true;
        }
        options.method = options.method || 'GET';
        var xhr = ajax.createXhr(options);
        return new Promise(resolve => {
            try {
                xhr.onreadystatechange = function() {
                    if (this.readyState == 4) {
                        this.options.response = this.response;
                        if (this.status >= 400) {
                            // create error object
                            this.options.error = new Error(this.options.url + ' - ' + this.statusText + ' (' + this.status + ')');
                        }
                        resolve(this.options);
                    }
                };
                xhr.send(options.data);
            } catch (err) {
                options.error = err;
                options.response = null;
                resolve(options);
            }
        });
    }
};

function debug_(txt, lvl) {
    //if (txt.indexOf('player.') == -1) return;
    if (DBGLVL >= lvl) {
        console.log(txt);
    }
}

function extend(b, e) {
    e.prototype = Reflect.construct(b, []);
    e.prototype.constructor = e;
    e.base = b.prototype;
}

/******************************************************************************
 * URL
 ******************************************************************************/
function Url(url) {
    this.schema = '';
    this.user = '';
    this.password = '';
    this.host = '';
    this.port = '';
    this.path = '';
    this.query = {};
    this.fragment = '';
    if (window.baseUrl != undefined) {
        this.schema = baseUrl.schema;
        this.user = baseUrl.user;
        this.password = baseUrl.password;
        this.host = baseUrl.host;
        this.port = baseUrl.port;
        this.path = baseUrl.path;
        Object.keys(baseUrl.query).forEach(k=>this.query[k]=baseUrl[k]);
        this.fragment = baseUrl.fragment;
    }
    if (url) this.parse(url);
};
Url.prototype.parse = function(url) {
    // 1. full schema: https://max:muster@www.example.com:8080/directory/index.html?p1=A&p2=B#ressource
    // 2. path: /directory/file /(. and .. are supported)
    // check schema
    var position = -1;
    var normalize = false;
    var schemas = [ 'http://', 'https://', 'file://', 'ftp://', 'mailto:' ];
    for (var i=0; i<schemas.length; i++) {
        // case #1: full schema expected
        var schema = schemas[i];
        if (url.indexOf(schema) == 0) {
            // set position after the schema
            this.schema = schema;
            position = schema.length;
            url = url.substring(position);
            break;
        }
    }
    if (position != -1) {
        // check user and password
        if (url.indexOf('@') != -1) {
            var tokens = url.split('@');
            url = tokens[1];
            tokens = tokens[0].split(':');
            this.user = tokens[0];
            this.password = tokens[1] || '';
        }
        // check host
        position = url.indexOf('/');
        if (position == -1) position = url.length;
        this.host = url.substring(0, position);
        var tokens = this.host.split(':');
        if (tokens.length > 1) {
            this.host = tokens[0];
            if (tokens[1] != '') {
                this.port = parseInt(tokens[1]);
                if (isNaN(this.port)) throw 'Invalid port number!';
            }
        }
    } else {
        // case #2: direct path expected
        position = 0;
        normalize = true;
    }
    if (position != -1) {
        url = url.substring(position);
        // check path
        // path ends with '?', '#', or EOS
        position = url.indexOf('?');
        if (position == -1) position = url.indexOf('#');
        if (position == -1) position = url.length;
        this.path = url.substring(0, position);
        if (normalize) this.path = normalizePath(this.path);
        url = url.substring(position);
        // check query
        if ((position = url.indexOf('?')) != -1) {
            var tokens = url.split('?');
            this.path = tokens[0];
            tokens = tokens[1].split('&');
            for (var i=0; i<tokens.length; i++) {
                var keyValue = tokens[i].split('=');
                this.query[keyValue[0]] = keyValue[1];
            }
        }
        url = url.substring(position);
        // check fragment
        if ((position = url.indexOf('#')) != -1) {
            var tokens = url.split('#');
            url = tokens[0];
            this.fragment = tokens[1];
        }
    } else {
        this.host = url;
    }
};
Url.prototype.normalize = function() {
    for (var i in baseUrl) {
        if (baseUrl.hasOwnProperty(i) && typeof baseUrl[i] !== 'function') {
            this[i] = this[i] || baseUrl[i];
        }
    }
    //this.path = load.normalizePath(this.path);
    return this.toString();
};
Url.prototype.toString = function() {
    // https://max:muster@www.example.com:8080/index.html?p1=A&p2=B#ressource
    var sb = [this.schema];
    if (this.user) {
        sb.push(this.user);
        if (this.password) sb.push(':', this.password);
        sb.push('@');
    }
    sb.push(this.host);
    if (this.schema != 'file' && this.schema != 'mailto' && this.port != '') {
        sb.push(':', this.port);
    }
    sb.push(this.path);
    var qk = Object.keys(this.query);
    if (qk.length > 0) {
        sb.push('?');
        var qkv = [];
        for (var k in this.query) {
            qkv.push(k + '=' + this.query[k]);
        }
        sb.push(qkv.join('&'));
    }
    if (this.fragment) sb.push('#', this.fragment);
    return sb.join('');
};

//*****************************************************************************

function Resource(url) {
    this.url = new Url(url).normalize();
    //this.resolvedAddress = '';
    this.resolvedUrl = null;
    // loaded data
    this.data = null;
    // created HTML node from the data
    this.node = null;
    // status of the resource
    this.status = Resource.NEW;
    // in case of error the instance of Error
    this.error = null;
}
Resource.load = async function(options) {
    // check resource cache
    var resource = Resource.cache[options.url];
    if (!resource) {
        // resource not found in cache
        resource = new Resource(options.url);
        // it will be loaded
        resource.status = Resource.LOADING;
        Resource.cache[options.url] = resource;
        // load
        debug_('LOAD ' + resource.toString(), 1);
        await ajax.send(options);
        resource.data = options.response;
        if (options.error != null) {
            resource.error = options.error;
            resource.status = Resource.ERROR;
        } else {
            //resource.resolvedAddress = options.resolvedUrl;
            resource.resolvedUrl = new Url(options.resolvedUrl);
            resource.status = Resource.LOADED;
            if (options.process) {
                await resource.processContent(options);
                // update resource
                resource = Resource.cache[options.url];
            }
        }
    } else {
        if (resource.status != Resource.COMPLETE && resource.status != Module.RESOLVED) {
            return new Promise( async function(resolve, reject) {
                var counter = 0;
                poll( function() {
                    if (counter++ == 10) {
                        resource.status = Resource.ERROR;
                        resource.error = new Error('Unspecified error!');
                        reject(resource);
                        return true;
                    }
                    if (Resource.cache[resource.url].status != Resource.LOADING) {
                        resolve(resource);
                        return true;
                    } else {
                        return false;
                    }
                }, 100);
            });
        }
    }
    debug_('CACHED ' + resource.toString(), 1);
    //debug_('Cached\n' + Object.values(Resource.cache).map(x=>'-'+x.toString()).join('\n'), 3);
    return resource;
};
Resource.prototype.processContent = async function(options) {
debug_('PROCESS @' + this.url, 1);
    var data = options.response;
    switch (options.contentType) {
        case 'text/javascript':
            // create Module from Resource
            var mdl = Module.fromResource(this);
            if (mdl.error == null) {
                Resource.cache[this.url] = mdl;
                debug_('CHANGED ' + mdl.toString(), 2);
                return mdl.resolveIncludes();
            }
            break;
        case 'x-shader/*':
        case 'x-shader/x-vertex':
        case 'x-shader/x-fragment':
            this.node = document.createElement('script');
            this.node.setAttribute('type', options.contentType);
            this.node.innerHTML = data;
            this.node.url = options.url;
            document.head.appendChild(this.node);
            break;
        case 'text/xml':
            this.node = data;
            break;
        case 'text/json':
            this.node = null;
            break;
        case 'text/html':
            this.node = data
            this.node.url = options.url;
            break;
        case 'text':
        case 'text/css':
            this.node = document.createElement('style');
            this.node.innerHTML = data;
            this.node.url = options.url;
            document.head.appendChild(this.node);
            break;
        case 'image/bmp':
        case 'image/gif':
        case 'image/jpg':
        case 'image/png':
            this.node = new Image();
            this.node.src = window.URL.createObjectURL(data);
            await this.node.decode();
            break;
        default: this.node = data; break;
    }
    this.status = Resource.COMPLETE;
};
Resource.prototype.toString = function() {
    return `RES@(${this.url}) - (${this.status})`;
};

Resource.cache = {};

Resource.NEW = 'new';
Resource.LOADING = 'loading';
Resource.LOADED = 'loading';
Resource.COMPLETE = 'complete';
Resource.ERROR = 'error';

Resource.searchPath = [];

//*************************************************************************
function Module(url) {
    Resource.call(this, url);
    // array of included modules
    this.includes = {};
    // published symbols
    this.symbols = {};
    Resource.call(this, url);
}
extend(Resource, Module);

Module.prototype.resolveIncludes = async function() {
    debug_('RESOLVE @' + this.url);
    // replace #include '...' and trigger loading of the resource
    //var re = /include\('([^']+)'\)/g;
    var re = /\/\/.*include\('([^']+)'\)|include\('([^']+)'\)/g;
    var loads = [];
    //var mdl = this;
    var currentPath = this.resolvedUrl.toString();
    currentPath = currentPath.substr(0, currentPath.lastIndexOf('/'));
    this.data = this.data.replace(re, (match, p1, p2) => {
        if (p1 != undefined) {
            return `${match} // skipped`;
        }
        if (p2 != undefined) {
            loads.push(include(p2, currentPath));
            return `// ${match} // included`;
        }
        return p2;
    });
    // load every includes
    var includes = await Promise.all(loads);
    debug_('DEPENDS @'+this.toString()+'\n' + includes.map(x=>`-${x.toString()}\n`).join(''), 2);
    debug_('CACHE\n' + Object.values(Resource.cache).map(x=>`-${x.toString()}\n`).join(''), 3);
    this.includes = [];
    for (var i=0; i<includes.length; i++) {
        var im = includes[i];
        if (im.status == Resource.ERROR) {
            this.error = new Error(`Could not load dependency: ${im.url}`);
            this.status = Resource.ERROR;
            return;
        }
        this.includes.push(im.url);
    }
    this.includes = includes.map(x=>x.url);
    // at this point every included module should be loaded and resolved

    this.status = Module.RESOLVED;
    debug_('ADD @' + this.toString() + '\n' + this.includes.map(x=>`-${x}\n`).join(''), 2);

    this.node = document.createElement('script');
    this.node.url = this.url;
    this.node.innerHTML = this.data;
    document.head.appendChild(this.node);
};

Module.prototype.toString = function() {
    return `MDL@(${this.url}) - (${this.status})`;
};

Module.fromResource = function(resource) {
    var mdl = new Module();
    for (var i in resource) {
        if (resource.hasOwnProperty(i)) {
            mdl[i] = resource[i];
        }
    }
    return mdl;
};

Module.RESOLVED = 'resolved';

/******************************************************************************
 * Boot, environment
 ******************************************************************************/
var baseUrl = (function(){
    var address = document.currentScript.src;
    var tokens = address.split('/');
    tokens.pop(); tokens.pop();
    return new Url(tokens.join('/'));
})();

var appUrl = (function(){
    var url = document.URL;
    var address = url.split('#')[0];
    var pos = address.lastIndexOf('/');
    if (pos == -1) pos == undefined;
    url = url.substring(0, pos);
    return new Url(url);
})();

var rootUrl = (function() {
    var i = 0;
    var a = baseUrl.toString();
    var b = appUrl.toString();
    for (var i=0; i<a.length; i++) {
        if (a.charAt(i) != b.charAt(i)) break;
    }
    if (a.charAt(i-1) == '/') i--;
    return new Url(a.substr(0, i));
})();

function addToSearchPath(url) {
    if (url === undefined) {
        url = document.currentScript.src || document.currentScript.url;
        url = url.substring(0, url.lastIndexOf('/'));
    }
    Resource.searchPath.push(url);
}

function normalizePath(path, base) {
    var base = base || baseUrl.path;
    var pathParts = base.split('/');
    if (pathParts[pathParts.length-1].length == 0) pathParts.pop();
    var arr = path.split('/');
    for (var i=0; i<arr.length; i++) {
        var part = arr[i];
        if (part == '' && i == 0) {
            pathParts = [rootUrl.path];
            continue;
        }
        if (part == '.') continue;
        if (part == '..') {
            if (pathParts.length > 1) {
                pathParts.pop();
                continue;
            }
        // }
        // if (part == '~') {
        //     if (i == 0) {
        //         pathParts = [rootUrl.path];
        //         continue;
        //     }
        } else {
            pathParts.push(part);
            continue;
        }
        throw new Error('Invalid path!');
    }
    return pathParts.join('/');
}

function poll(action, timeout) {
    async function poll_(action, timeout, resolve, args) {
        clearTimeout(action.timer);
        var result = await action(...args);
        if (result) resolve(result);
        else action.timer = setTimeout(poll_, timeout, action, timeout, resolve, args);
    }

    var args_ = [];
    for (var i=2; i<arguments.length; i++) {
        args_.push(arguments [i]);
    }
    return new Promise( resolve => {
        poll_(action, timeout || 100, resolve, args_);
    });
}

var locks__ = {};
function lock(token, action) {
    if (locks__[token] == undefined) {
        locks__[token] = [0, 0];
    }
    return new Promise( resolve => {
        poll( function() {
            var request = locks__[token][0];
            if (request == locks__[token][1]) {
                locks__[token][0]++;
                if (locks__[token][0] == request + 1) {
                    debug_('locked: ' + locks__[token], 1);
                    return true;
                }
            }
            return false;
        }).then(async function() {
            await action();
            locks__[token][1] = locks__[token][0];
            resolve();
            debug_('unlocked: ' + locks__[token], 1);
        });
    });
}

/******************************************************************************
/* Loading function
******************************************************************************/ 
/******************************************************************************
 * Examples
 *  - load('config.xml');
 *  - load(['user.xml', 'config.xml', 'web.xml']);
 *  - load({ url: 'config.xml', contentType: 'xml' });
 *  - load([ { url: 'user.html', contentType: 'html', method: 'get' },
 *              { url: 'app.cfg', contentType: 'xml', method: 'post' } ]);
 ******************************************************************************/
function load(obj) {
    if (!Array.isArray(obj)) {
        var options = { error: null };
        if (typeof obj === 'string') {
            options.url = obj;
        } else {
            for (var i in obj) {
                options[i] = obj[i];
            }
        }
        if (options.process === undefined) {
            options.process = true;
        }
        return Resource.load(options);
    } else {
        var loads = [];
        for (var i=0; i<obj.length; i++) {
            var item = obj[i];
            var options = typeof item === 'string' ? { url: item } : item;
            // process response by default
            if (options.process === undefined) {
                options.process = true;
            }
            loads.push(Resource.load(options));
        }
        return Promise.all(loads);
    }
}

function public(obj, name, context) {
    var script = document.currentScript;
    var url = script.src || script.url;
    var mdl = Resource.cache[url];
    if (mdl === undefined) {
        throw new Error('Module \'' + url + '\' not found!');
    }
    context = context || window;
    mdl.symbols[name] = obj;
    context[name] = obj;
    
}

async function include(path, parentPath) {
    debug_('INCLUDE @' + path, 1);
    parentPath = parentPath || appUrl;
    var mdl = null;
    var searchPath = null;
    if (path.startsWith('/')) {
        searchPath = [baseUrl];
        path = path.substr(1);
    } else {
        searchPath = [parentPath, baseUrl.toString()];
        searchPath.push(...Resource.searchPath);
    }
    for (var i=0; i<searchPath.length; i++) {
        var url = searchPath[i] + '/' + path;
        mdl = await load(url);
        if (!mdl.error) {
            break;
        }
    }
    debug_('INCLUDED @' + mdl.toString()), 2;
    return mdl;
}

/*****************************************************************************/
Array.prototype.binSearch = function(item, cmp, min, max) {
    if (this.length == 0) {
        return 0;
    }
	if (min == undefined) min = 0;
	if (max == undefined) max = this.length;
    if (cmp == undefined) cmp = (a, b) => a - b;

	while (min < max) {
		var mid = (min + max)>>1;
        var i = (cmp != undefined) ? cmp(item, this[mid]) : item.compare != undefined ? item.compare(this[mid]) : item - mid;
		if (i == 0) return mid;
		if (i < 0) { // continue with the first half-range: [min, mid]
			max = mid;
		} else { // continue with the second half-range: [mid+1, max]
			min = mid + 1;
		}
	}
	return -max;
};

window.onload = e => poll(function() {
    var errors = [];
    for (var i in Resource.cache) {
        var res = Resource.cache[i];
        if (res.status == Resource.ERROR) {
            errors.push(res.error);
        } else if (res.status != Resource.COMPLETE && res.status != Resource.ERROR && res.status != Module.RESOLVED) {
            return false;
        }
    }
    debug_('onload - resource loading complete');
    onpageload(errors);
    return true;
});
