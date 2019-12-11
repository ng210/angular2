include('/base/dbg.js');

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    var url = new Url(location.href);
    var testUrl = new Url(`${url.fragment}/test.js`);

    Dbg.prln(`Load '${testUrl}'`);
    var module = await load(testUrl.toString());
    await load(new Url(`${url.fragment}/test.css`).toString());
    if (module && module.error == null && module.symbols != null) {
        var testName = Object.keys(module.symbols)[0];
        var test = module.symbols[testName];
        if (typeof test === 'function') {
            Dbg.prln(`Running '${testName}'...`);
            var ret = await test();
            Dbg.prln(`Test returned ${ret}`, 1);
        }
    } else {
        Dbg.prln(`Error loading ${module.error}`);
    }
}