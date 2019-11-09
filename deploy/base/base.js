try {
    (function() {
        // Resource, Module, subtype
        Object.defineProperties(window, {
            'subtype': {
                writeable: false,
                enumerable: false,
                value: (subType, superType) => {
                    subtype.super = supertype;
                    subtype.prototype = Reflect.construct(supertype);
                }
            },
            'Resource': {
                writeable: false,
                enumerable: false,
                value: (function() {
                    function Resource(url) {
                        // requested URL
                        Object.defineProperties(this, {
                            'url_': {
                                writeable: false,
                                enumerable: false,
                                value: url
                            },
                            'url': {
                                writeable: true,
                                enumerable: true,
                                set: function(v) { this.url_ = v },
                                get: function() { return this.resolvedUrl ? this.resolvedUrl : this.url_ }
                            }
                        });
                        // URL resource was loaded from
                        this.resolvedUrl = null;
                        // loaded data
                        this.data = null;
                        // created HTML node from the data
                        this.node = null;
                        // status of the resource
                        this.status = Resource.NEW;
                        // in case of error the instance of Error
                        this.error = null;
                        this.constructor = Resource;
                    }
                    Resource.NEW = 1;
                    Resource.LOADING = 2;
                    Resource.COMPLETE = 3;
                    Resource.ERROR = 4;
                    Resource.Status = [ 'invalid', 'new', 'loading', 'complete', 'error' ];

                    Resource.cache = {};

                    // array of paths used at loading
                    Resource.searchPath = [];

                    Resource.prototype.toString = function() {
                        return `RES@(${this.url}) - st:${Resource.Status[this.status]}(${this.status})`;
                    };

                    return Resource;
                })()
            },
            'Module': {
                writeable: false,
                enumerable: false,
                value: (function() {
                    function Module(url) {
                        this.resource = new Resource(url);
                        // array of included modules
                        this.includes = [];
                        // published symbols
                        this.symbols = {};

                        Object.defineProperties(this, {
                            'status': {
                                writeable: true,
                                enumerable: false,
                                get: function() { return this.resource.status; },
                                set: function(v) { this.resource.status = v; }
                            },
                            'data': {
                                writeable: true,
                                enumerable: false,
                                get: function() { return this.resource.data; },
                                set: function(v) { this.resource.data = v; }
                            },
                            'node': {
                                writeable: true,
                                enumerable: false,
                                get: function() { return this.resource.node; },
                                set: function(v) { this.resource.node = v; }
                            },
                            'url': {
                                writeable: false,
                                enumerable: false,
                                get: function() { return this.resource.url; }
                            },
                            // private member
                            'error_': {
                                writeable: false,
                                enumerable: false,
                                value: null
                            },
                            // public member
                            'error': {
                                writeable: false,
                                enumerable: false,
                                set: function(v) { this.error_ = v; },
                                get: function() { return this.error_ != null ? this.error_ : this.resource.error; }
                            },
                        });
                        this.constructor = Module;
                    }
                    // static cache of loaded modules
                    Module.cache = {};

                    Module.RESOLVED = 100;
                    Module.ALIAS = 101;
                    Module.MISSING = 102;
    
                    // static load of a module from URL
                    Module.load = async function(url) {
                        // create new module with status loading
                        var mdl = new Module(url);
                        mdl.status = Resource.LOADING;
                        // store new module
                        Module.cache[mdl.url] = mdl;
                        // load resource
                        mdl.resource = await load({url: url, process:false});
                        try {
                            if (mdl.error != null) {
                                throw mdl.error;
                            }
                            await mdl.processContent();
                        } catch (err) {
                            mdl.error = err;
                        }
                        return mdl;
                    };
    
                    Module.prototype.resolveIncludes = async function() {
                        // replace #include '...' and trigger loading of the resource
                        var re = /[^\/*]?include\('([^']+)'\)/g;
                        var loads = [];
                        var mdl = this;
                        this.data.replace(re, (match, p1) => {
                            // include module
                            loads.push(include(p1));
                            return `//include('${p1}')`;
                        });
                        return Promise.all(loads).then(
                            includes => {
                                for (var i=0; i<includes.length; i++) {
                                    mdl.includes.push(includes[i]);
                                    //includes[i].resource.requester = mdl;
                                }
                            },
                            err => {
                                return err;
                            }
                        );
                    };
                    Module.prototype.buildDependencyOrder = function() {
                        function dfs(mdl, order) {
                            if (mdl.status !== Module.RESOLVED) {
                                for (var i=0; i<mdl.includes.length; i++) {
                                    var dm = mdl.includes[i];
                                    if (!dm.visited) {
                                        dm.visited = true;
                                        dfs(dm, order);
                                    }
                                }
                                order.push(mdl);
                            }
                        }
                        var order = [];
                        dfs(this, order);
                        //order.push(this);
                        return order;
                    };
                    Module.prototype.processContent = async function() {
                        // search and load referenced modules
                        await this.resolveIncludes();
                        // build dependency order from the includes
                        var order = this.buildDependencyOrder();
                        // add included modules to DOM
                        for (var i=0; i<order.length; i++) {
                            var dm = order[i];
                            if (dm.node == null) {
                                //var script = dm.data.replace(/#include\('([^']+)'\)/g, '');
                                dm.node = document.createElement('script');
                                dm.node.url = dm.url;
                                dm.node.innerHTML = dm.data;
                                // dm.data = undefined;
                                document.head.appendChild(dm.node);
                            } else {
                                console.log(`${mdl} added already`);
                            }
                        }
                        // set module to resolved to make it available
                        this.status = Module.RESOLVED;
                    };
                    Module.prototype.toString = function() {
                        return `MDL@(${this.url} #${this.status})`;
                    };

                    return Module;
                })()
            }
        });
        // ajax, load, Url, include, public
        Object.defineProperties(window, {
            'Boot': {
                writeable: false,
                enumerable: false,
                value: {
                    addToSearchPath: function(url) {
                        if (url === undefined) {
                            url = document.currentScript.src || document.currentScript.url;
                            url = url.substring(0, url.lastIndexOf('/'));
                        }
                        Resource.searchPath.push(url);
                    },
                    waitForLoadingResources: function() {
                        clearTimeout(Boot.loadTimer);
                        // check modules
                        var resolved = 0;
                        var errors = [];
                        for (var i in Module.cache) {
                            var mdl = Module.cache[i];
                            if (mdl.status == Module.MISSING) {
                                errors.push(mdl.error);
                            } else {
                                if (mdl.status != Module.RESOLVED && mdl.status != Module.ALIAS) {
                                    // if a module is still being resolved, retrigger
                                    Boot.loadTimer = setTimeout(Boot.waitForLoadingResources, 100);
                                    return;
                                }
                            }

                        }
                        onpageload(errors);
                    },
                }
            },
            'include': {
                writeable: false,
                enumerable: false,
                value: async function(path) {
                    var mdl = null;
                    var searchPath = null;
                    if (path.startsWith('/')) {
                        searchPath = [rootUrl];
                        path = path.substr(1);
                    } else {
                        searchPath = [baseUrl.toString()];
                        searchPath.push(...Resource.searchPath);
                    }
                    for (var i=0; i<searchPath.length; i++) {
                        var url = searchPath[i] + '/' + path;
                        if (Module.cache[url] !== undefined) {
                            mdl = Module.cache[url];
                            // wait until mdl.status != Resource.RESOLVED
                            if (mdl.status != Module.RESOLVED && mdl.status != Module.ALIAS) {
                                // set up a timed callback to query the status
                                // this is packed inside a Promise
                                // that is synced to using the await keyword
                                var timer = null;
                                var count = 0;
                                function checkState(resolve) {
                                    // maximum of 3 polls
                                    if (count++ > 3) {
                                        // error case
                                        mdl.state = Resource.ERROR;
                                        mdl.error = new Error('Could not resolve module!');
                                        resolve(mdl);
                                    } else {
                                        if (timer != null) clearTimeout(timer);
                                        if (mdl.status === Module.RESOLVED || mdl.status === Module.ALIAS) {
                                            resolve(mdl);
                                        } else {
                                            setTimeout(checkState, 100, resolve);
                                        }
                                    }
                                }
                                // await the fullfilled Promise with the status of the module
                                await (async function() {
                                    return new Promise(resolve => {
                                        checkState(resolve);
                                    })
                                })();
                            }                            
                            break;
                        }
                        mdl = await Module.load(url);
                        if (!mdl.error) {
                            // module was loaded successfully
                            // the same module might be missed under a different path
                            for (var url in Module.cache) {
                                if (url.endsWith(path) ) {
                                    var dm = Module.cache[url];
                                    if (dm.status === Resource.ERROR ||
                                            dm.status === Module.MISSING || dm.status === Module.ERROR) {
                                        dm.status = Module.ALIAS;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    if (mdl.status !== Module.RESOLVED && mdl.status !== Module.ALIAS) {
                        // the module might have been resolved under a different path
                        for (var i=0; i<searchPath.length; i++) {
                            var url = searchPath[i] + '/' + path;
                            var dm = Module.cache[url];
                            if (dm !== undefined && mdl != dm) {
                                if (dm.status === Module.RESOLVED) {
                                    mdl.status = Module.RESOLVED;   // ALIAS
                                    debugging;
                                    break;
                                }
                            }
                        }
                        mdl.status = Module.MISSING;
                    }
                    return mdl;
                }
            },
            'public': {
                writeable: false,
                enumerable: false,
                value: (obj, name) => {
                    var script = document.currentScript;
                    var url = script.src || script.url;
                    var mdl = Module.cache[url];
                    if (mdl === undefined) {
                        throw new Error('Module \'' + url + '\' not found!');
                    }
                    window[name] = mdl.symbols[name] = obj;            
                }
            },
            'ajax': {
                writeable: false,
                enumerable: false,
                value: {
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
                }
            },
            'load': {
                writeable: false,
                enumerable: false,
                value: (function() {
                // Examples
                //     load('config.xml');
                //     load(['user.xml', 'config.xml', 'web.xml']);
                //     load({ url: 'config.xml', contentType: 'xml' });
                //     load([  { url: 'user.html', contentType: 'html', method: 'get' },
                //             { url: 'app.cfg', contentType: 'xml', method: 'post' } ]);
                    var load = function(obj) {
                        if (!Array.isArray(obj)) {
                            var options = {
                                error: null
                            };
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
                            return load.load_(options);
                        } else {
                            var loads = [];
                            for (var i=0; i<obj.length; i++) {
                                var item = obj[i];
                                var options = typeof item === 'string' ? { url: item } : item;
                                // process response by default
                                if (options.process === undefined) {
                                    options.process = true;
                                }
                                loads.push(load.load_(options));
                            }
                            return Promise.all(loads);
                        }
                    };
                    load.load_ = function(options) {
                        return new Promise( resolve => {
                            // check resource cache
                            var resource = Resource.cache[options.url];
                            if (resource !== undefined) {
                                // resource was cached
                                resolve(resource);
                            } else {
                                // resource not found in cache
                                resource = new Resource(options.url);
                                // it will be loaded
                                resource.status = Resource.LOADING;
                                Resource.cache[options.url] = resource;
                                // load
                                ajax.send(options).then( async function() {
                                    resource.data = options.response;
                                    resource.error = options.error;
                                    if (options.error != null) {
                                        // fill resource for error
                                        resource.status = Resource.ERROR;
                                        resolve(resource);
                                    } else {
                                        // fill resource
                                        resource.resolvedUrl = options.resolvedUrl;
                                        resource.status = Resource.COMPLETE;
                                        if (options.process) {
                                            resource.node = await load.processContent(options, resource);
                                            if (Module.cache[resource.url] !== undefined) {
                                                resource = Module.cache[resource.url];
                                            } else {
                                                if (resource.node instanceof Image) {
                                                    // todo: check this!
                                                    setTimeout(function(re) {
                                                        var w = re.node.width;
                                                        resolve(re)
                                                    }, 50, resource);
                                                    return;
                                                }
                                            }
                                        }
                                        resolve(resource);
                                    }
                                });
                            }
                        });
                    };
                    load.processContent = async function(options, resource) {
                        var node = null;
                        var data = options.response;
                        switch (options.contentType) {
                            case 'text/javascript':
                                // create new module from resource
                                // and resolve includes
                                var mdl = new Module(resource.url);
                                mdl.resource = resource;
                                try {
                                    if (mdl.error != null) {
                                        throw mdl.error;
                                    }
                                    Module.cache[mdl.url] = mdl;

                                    await mdl.processContent();
                                } catch (err) {
                                    mdl.error = err;
                                    //Resource.status = Resource.ERROR;
                                }
                                break;
                            case 'x-shader/*':
                            case 'x-shader/x-vertex':
                            case 'x-shader/x-fragment':
                                node = document.createElement('script');
                                node.setAttribute('type', options.contentType);
                                node.innerHTML = data;
                                node.url = options.url;
                                document.head.appendChild(node);
                                break;
                            case 'text/xml':
                                node = data;
                                break;
                            case 'text/json':
                                node = null;
                                break;
                            case 'text/html':
                                node = data
                                node.url = options.url;
                                break;
                            case 'text':
                            case 'text/css':
                                node = document.createElement('style');
                                node.innerHTML = data;
                                node.url = options.url;
                                document.head.appendChild(node);
                                break;
                            case 'image/bmp':
                            case 'image/gif':
                            case 'image/jpg':
                            case 'image/png':
                                node = new Image();
                                node.src = window.URL.createObjectURL(data);
                                break;
                            default: node = data; break;
                        }
                        return node;
                    };    
                    load.normalizePath = function(path, base) {
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
                    };
                    return load;
                })()
            },
            'Url': {
                writeable: false,
                enumerable: false,
                value: (function(){
                    var ctor = function(url) {
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
                        this.parse(url);
                    };
                    ctor.prototype.parse = function(url) {
                        // 1. full schema: https://max:muster@www.example.com:8080/directory/index.html?p1=A&p2=B#ressource
                        // 2. path: /directory/file /(. and .. are supported)
                        // check schema
                        var position = -1;
                        var normalizePath = false;
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
                            normalizePath = true;
                        }
                        if (position != -1) {
                            url = url.substring(position);
                            // check path
                            // path ends with '?', '#', or EOS
                            position = url.indexOf('?');
                            if (position == -1) position = url.indexOf('#');
                            if (position == -1) position = url.length;
                            this.path = url.substring(0, position);
                            if (normalizePath) this.path = load.normalizePath(this.path);
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
                    ctor.prototype.normalize = function() {
                        for (var i in baseUrl) {
                            if (baseUrl.hasOwnProperty(i) && typeof baseUrl[i] !== 'function') {
                                this[i] = this[i] || baseUrl[i];
                            }
                        }
                        //this.path = load.normalizePath(this.path);
                        return this.toString();
                    };
                    ctor.prototype.toString = function() {
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
                    return ctor;
                })()
            }
        });
        // baseUrl, rootUrl
        Object.defineProperties(window, {
            'baseUrl': {
                writeable: false,
                enumerable: false,
                value:(function(){
                    var url = document.URL;
                    var address = url.split('#')[0];
                    var pos = address.lastIndexOf('/');
                    if (pos == -1) pos == undefined;
                    url = url.substring(0, pos);
                    return new Url(url);
                })()
            },
            'rootUrl': {
                writeable: false,
                enumerable: false,
                value:(function(){
                    var address = document.currentScript.src;   //document.URL.split('#')[0];
                    var tokens = address.split('/');
                    tokens.pop(); tokens.pop();
                    return new Url(tokens.join('/'));
                })()
            }
        });

        Boot.addToSearchPath();
        Boot.addToSearchPath( (function(){
            var tokens = document.currentScript.src.split('/');
            tokens.pop(); tokens.pop();
            return tokens.join('/');
        })()
        );

        // create base module
        (function() {
            var script = document.currentScript;
            var mdl = new Module(script.src || script.url);
            mdl.node = script;
            mdl.status = Module.RESOLVED;
            mdl.symbols = { 'ajax':ajax, 'load':load, 'Url':Url };
            Module.cache[mdl.url] = mdl;
        })();

        window.onload = e => {
            Boot.loadTimer = setTimeout(Boot.waitForLoadingResources, 100);
        };
    })();
} catch (error) {
    alert(error.message + '\n' + error.stack);
}

