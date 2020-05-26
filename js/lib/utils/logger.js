(function(){
    function Log(options) {
        this.counter = 0;
        this.level = 4;
        this.format = '#{{counter}} {{level}} - {{file}}::{{method}}({{line}}): {{message}}';
        this.timestampFormat = 'yyyy-MM-dd hh:mm:ss.fff';
        this.preprocess = null;
        this.print = {
            context: null,
            method: function(data) {
                console.log(data);
            }
        };
        if (options) {
            if (typeof options.format === 'string' && options.format.length > 0) {
                this.format = options.format;
            }
            if (typeof options.timestampFormat === 'string' && options.timestampFormat.length > 0) {
                this.timestampFormat = options.timestampFormat;
            }
            if (options.preprocess && typeof options.preprocess.method === 'function') {
                this.preprocess = options.preprocess;
            }
            if (options.level != undefined) {
                this.setLevel(options.level);
            }
            if (options.print && typeof options.print.method === 'function') {
                this.print = options.print;
            }
        }
    }
    Log.separator = '/';  //__filename.indexOf('\\') != -1 ? '\\' : '/';
    Log.levels = [ 'LOG', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE' ];
    Log.colors = {
        'LOG':   '#404040',
        'TRACE': '#404080',
        'DEBUG': '#8080ff',
        'INFO':  '#808080',
        'WARN':  '#a08020',
        'ERROR': '#804040',
        'NONE':  '#000000'
    };

    Log.prototype.setLevel = function(lvl) {
        var l = 0;
        if (typeof lvl === 'string') {
            l = Log.levels.indexOf(lvl.toUpperCase());
            if (l == -1) {
                l = parseInt(lvl);
            }
        } else if (typeof lvl === 'number') {
            l = lvl;
        }
        if (!isNaN(l) && l>=0 && l<=Log.levels.length) {
            this.level = l;
        }
    };
    Log.prototype.getLevel = function() {
        return Log.levels[this.level];
    };
    Log.prototype.formatDate = function(d) {
        if (this.timestampFormat == null) {
            return d.toLocaleString();
        } else {
            var output = this.timestampFormat;
            var month = d.getMonth()+1;
            var day = d.getDate();
            var hour = d.getHours();
            var min = d.getMinutes();
            var sec = d.getSeconds();
            var ms = d.getMilliseconds();
            var tokens = {
                'yyyy': d.getFullYear(),
                'MM': month > 9 ? month : '0' + month,
                'dd': day > 9 ? day : '0' + day,
                'hh': hour > 9 ? hour : '0' + hour,
                'mm': min > 9 ? min : '0' + min,
                'ss': sec > 9 ? sec : '0' + sec,
                'fff': ('000'+ms).slice(-3)
            };
            for (var k in tokens) {
                output = output.replace(k, tokens[k]);
            }
        }
        return output;
    };
    Log.prototype.prepareStack = function() {
        var err = new Error();
        // STACK: [0]'Error', [1]prepareStack, [2]prepareOutput [3]log_, [4]trace/debug/info/error, [5]<caller>
        var rows = err.stack.split('\n');
        var row = rows[0].startsWith('Error') ? rows[5] : rows[4];
        // Ch: at loggerTest (test.out.js:240)
        var tokens = row.match(/\s*at\s+([^\(]+)\(([^:]+):(\d+)/);
        if (tokens == null) {
            // E: at loggerTest (http://localhost:8080/test/test.out.js:240:9)
            tokens = row.match(/\s*at\s+([^\(]+)\(.+\/([^\/:]+):(\d+):\d+\)$/);
        }
        if (tokens == null) {
            // FF: loggerTest@http://localhost:8080/test/test.out.js:240:9
            tokens = row.match(/\s*([^\(]+)@.+\/([^\/:]+):(\d+):\d+$/);
        }
        // 0: matched part, 1: method, 2: fullPath, 3: line
        var data = null;
        if (tokens != null) {
            var fullPath = tokens[2].split(Log.separator);
            var data = {
                method: tokens[1].trim(),
                file: fullPath.pop().trim(),
                path: '',
                line: tokens[3].trim()
            };
            data.path = fullPath.join(Log.separator);
        } else {
            data = {
                method: '',
                file: '',
                path: row,
                line: ''
            };
        }
        return data;
    };
    Log.prototype.prepareOutput = function(lvl, txt) {
        var data = this.prepareStack();
        data.timestamp = this.formatDate(new Date());
        data.level = Log.levels[lvl];
        data.message = txt;
        data.counter = this.counter < 1000 ? ('0000' + this.counter).slice(-4) : this.counter;
        this.counter++;
        if (this.preprocess != null) {
            this.preprocess.method.call(this.preprocess.context, data);
        }
        var output = this.format;
        for (var i in data) {
            output = output.replace(`{{${i}}}`, data[i]);
        }
        // add colors
        output = output.replace('{{color}}', '<span style="color:' + Log.colors[Log.levels[lvl]] + '">');
        output = output.replace('{{color}}', '</span>');
        return output;
    };
    Log.prototype.log_ = function(lvl, txt) {
        if (this.level <= lvl) {
            var output;
            try {
                output = this.prepareOutput(lvl, txt);
            } catch(ex) {
                output = ` *** Logging error ${ex.message} while logging '${txt}'.`;
            }
            this.print.method.call(this.print.context, output);
        }
    };

    Log.prototype.log = function(msg) {
        this.log_(0, msg);
    };
    Log.prototype.trace = function(msg) {
        this.log_(1, msg);
    };
    Log.prototype.debug = function(msg) {
        this.log_(2, msg);
    };
    Log.prototype.info = function(msg) {
        this.log_(3, msg);
    };
    Log.prototype.warn = function(msg) {
        this.log_(4, msg);
    };
    Log.prototype.error = function(msg) {
        this.log_(5, msg);
    };
    Log.prototype.hr = function() {
        this.print.method.call(this.print.context, '<hr/>');
    };
    public(Log, 'Log');
})();