(function(){
    var dummy = {
        func1: function() {
            document.getElementById('content').innerHTML += "dummy.func1 say 'Hello world!'";
        }
    };
    publish(dummy, 'dummy');
})();
