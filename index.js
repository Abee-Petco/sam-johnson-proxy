const express = require('express');
const serveStatic = require('serve-static');
require('newrelic');
// const morgan = require('morgan');

const server = express();

// server.use(morgan('dev'));
server.use(serveStatic('./client/'));

server.get('/product', (req, res) => {
  const { itemID } = req.query;
  const itemIdNumber = Number.parseInt(itemID, 10);

  if (itemIdNumber < 100 || itemIdNumber > 199 || itemIdNumber === undefined) {
    res.status(404).send('itemID invalid');
  } else {
    res.sendFile(`${__dirname}/client/index.html`);
  }
});

server.listen(3000);
