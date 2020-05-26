include('/utils/syntax.js');
include('grammar.js');
include('/base/dbg.js');
include('/lib/ui/board.js');
include('/lib/ui/textbox.js');
include('/lib/ui/button.js');
include('/lib/ui/label.js');
include('/lib/ui/grid.js');

var database = null;
var ui = null;
var data = null;

async function onpageload(e) {
    Dbg.init('con');
    Dbg.con.style.visibility = 'visible';

    await prepareData();
    await renderUi();
}

async function renderUi() {

    var template = await load('ingatlan.json');
    ui = new Ui.Board('main', template.data, this);
    ui.dataBind(data);
    data = ui.dataSource;
    ui.items.search.onclick = e => search(data.input);
    ui.render({ 'element': document.getElementById('container') });
}

async function prepareData() {
    data = new Ui.DataLink({
        "input": "prop(location) ~ Zala",
        "results": []
    });
    var resource = await load('ingatlan_database.json');
    if (resource instanceof Error) {
        Dbg.prln(resource);
        return;
    }
    database = resource.data;
    Dbg.prln(database.length + ' entries read');
}
function search(expr) {
    try {
        var syntax = new Syntax(grammar);
        var expression = syntax.parse(expr).resolve();

        var hits = [];
        for (var i = 0; i < database.length; i++) {
            if (expression.evaluate(database[i]) == true) {
                hits.push(database[i]);
                //Dbg.prln(database[i].location);
            }
        }
        data.results = hits;
        ui.items.results.build();
        ui.items.results.render(ui);
        //ui.items.results.refresh();
        Dbg.prln('Match count: ' + hits.length);
    } catch (err) {
        Dbg.prln(err.message);
    }
}

function main(expr) {
    //console.log(new Syntax(grammar).parse("1+2+3+4").resolve());
    var result = new Syntax(grammar).parse(expr).resolve().evaluate();
    Dbg.prln(`${expr} = ${result}`);
    return;

    console.log('\n*** Ingatlan adatbázis');
    var cmd = argv[2];
    switch (cmd) {
        case 'a':
        case 'add':
            addDataFile(process.argv[3]);
            break;
        case 'q':
        case 'g':
        case 'get':
            queryData(process.argv.slice(3));
            break;
        default:
            console.log('Elérhető parancsok:\n -a/add: új JSON adat fájl hozzáadása\n -q/g/get: adatok lekérdezése\n\n');
    }
}

function addDataFile(path) {
    if (!fs.existsSync(path)) {
        console.error('\n*** A fájl nem található!\n\n');
        return;
    }
    var data = require(path);
    if (!Array.isArray(data)) {
        console.error('\n*** A fájl formátuma rossz, egy JSON tömböt várok!\n\n');
        return;
    }
    var database = [];
    if (!fs.existsSync('ingatlan_database.json')) {
        fs.openSync('ingatlan_database.json', 'w');
    } else {
        database = require('./ingatlan_database.json');
    }

    console.log(` * ${data.length} cím a fájlban.\n`);
    var cache = [];
    var updated = 0;
    var duplicated = 0;
    for (var i = 0; i < data.length; i++) {
        var item = database.find(x => x.link == data[i].link);
        if (item == null) {
            database.push(data[i]);
            cache.push(data[i]);
        } else {
            var isUpdated = false;
            for (var a in item) {
                if (item[a] == '?' && data[i][a] != '?' || item[a] == '') {
                    console.log(`${a}: "${item[a]}" => "${data[i][a]}"`);
                    isUpdated = true;
                    item[a] = data[i][a];
                } else {
                }
            }
            if (isUpdated) {
                updated++;
                console.log(`Cím ${item.location}/${item.houseSize}/${item.lotSize} aktualizálva`);

            } else {
                duplicated++;
                console.log(`Cím már létezik: ${item.location}/${item.houseSize}/${item.lotSize}`);

            }
        }
    }
    console.log(` * ${cache.length} cím hozzáadva.\n`);
    console.log(` * ${updated} cím aktualizálva.\n`);
    console.log(` * ${duplicated} cím már létezett.\n`);

    if (database.length > 0) {
        fs.writeFileSync('ingatlan_database.json', JSON.stringify(database));
    }
}

function queryData(args) {
    const database = require('./ingatlan_database.json');
    var expr = args.join(' ');
    Dbg.prln(`Keresés: ${expr}`);
    var syntax = new Syntax(grammar);
    var expression = syntax.parse(expr).resolve();

    var hits = [];
    for (var i = 0; i < database.length; i++) {
        if (expression.evaluate(database[i]) == true) {
            hits.push(database[i]);
        }
    }

    // if (hits.length == 0) {
    //     console.log(' * Nincs találat!\n\n');
    // } else {
    //     console.log(` * ${hits.length} találat\n`);
    //     for (var i=0; i<hits.length; i++) {
    //         var item = hits[i];
    //         console.log(`${item.location}/${item.houseSize}/${item.lotSize}/${item.price}`);
    //     }
    // }
}

// var output = {items:[]};
// for (var i=0; i<data.items.length; i++) {7
//     var item = data.items[i];
//     if (item.longitude == '?' || item.latitude == '?') {
//         item.longitude = undefined;
//         item.latitude = undefined;
//         output.items.push(item);
//     }
// }
// fs.writeFileSync('ingatlan_missing.json', JSON.stringify(output));

// var R = 6371e3; // metres
// var φ1 = lat1.toRadians();
// var φ2 = lat2.toRadians();
// var Δφ = (lat2-lat1).toRadians();
// var Δλ = (lon2-lon1).toRadians();
// var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
//         Math.cos(φ1) * Math.cos(φ2) *
//         Math.sin(Δλ/2) * Math.sin(Δλ/2);
// var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

// var d = R * c;