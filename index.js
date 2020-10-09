const express = require("express");
const serveStatic = require("serve-static");
const axios = require("axios");
// require("newrelic");
// const morgan = require('morgan');
const redis = require('redis');
let client;

const server = express();

// server.use(morgan('dev'));
server.use(serveStatic("./client/loaderio/"));

//redis caching middleware
if (process.env.node_env === 'production') {
  client = redis.createClient({ host: 'redis' });
} else {
  client = redis.createClient();
}

const redisMiddleware = (req, res, next) => {
  let key = '__expIress' + req.originalUrl || req.url;
  client.get(key, function (err, reply) {
    if (reply) {
      res.send(reply);
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        typeof body === 'string' ? client.setex(key, 600, body) : client.setex(key, 600, JSON.stringify(body));
        res.sendResponse(body);
      };
      next();
    }
  });
};

server.get("/product", (req, res) => {
  const { itemID } = req.query;
  const itemIdNumber = Number.parseInt(itemID, 10);

  if (
    itemIdNumber < 100 ||
    itemIdNumber > 10000100 ||
    itemIdNumber === undefined
  ) {
    res.status(404).send("itemID invalid");
  } else {
    axios
      .get(
        `http://3.16.155.15/component/?itemId=${itemIdNumber}`,
      )
      .then((componentData) => {
        const { windowData, serviceApp } = componentData.data;
        res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <script>window.__initData__ = ${windowData}</script>
          </head>
          <body>
            <div id="description" style="margin: 0 0 20px 0;">${serviceApp}</div>
          </body>
          <script crossorigin src="http://3.132.55.48:8080/bundle.js" ></script>
        </html>
        `);
      })
      .catch((err) => res.send(err));
  }
});

server.listen(3000);
