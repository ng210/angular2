const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const documentPath = 'd:/code/git/webdev';

app.get('/*', function(req, resp) {
    var resPath = path.normalize(path.join(documentPath, req.path));
    var exists = fs.existsSync(resPath);
    if (exists) {
        if (fs.statSync(resPath).isDirectory()) {
            resPath += 'index.html';
        }
        if ((exists = fs.existsSync(resPath)) == true)  {
            //console.log(`requested: ${resPath}`);
            resp.sendFile(resPath);
        }
    }
    if (!exists) {
        resp.status(404).sendFile(`${__dirname}/404.html`);
    }
});


console.log(`server is listening on ${port}`);
app.listen(port);
