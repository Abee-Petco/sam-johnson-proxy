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
      console.log('from cache!');
      res.send(reply);
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        typeof body === 'string' ? client.set(key, body) : client.set(key, JSON.stringify(body));
        res.sendResponse(body);
      };
      next();
    }
  });
};

server.get("/product", redisMiddleware, (req, res) => {
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
        `http://ec2-3-19-16-18.us-east-2.compute.amazonaws.com/component/?itemId=${itemIdNumber}`,
      )
      .then((componentData) => {
        const { windowData, serviceApp } = componentData.data;
        res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <script>window.__initData__ = ${windowData}</script>
            <title>A PetToyCo proxy server - Nick</title>
            <script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
            <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.min.js"></script>
            <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/redux/4.0.5/redux.min.js"></script>
            <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-redux/7.2.0/react-redux.min.js"></script>
            <script crossorigin src="https://momentjs.com/downloads/moment.min.js"></script>
            <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
            <script src="https://code.jquery.com/jquery-3.5.1.js" integrity="sha256-QWo7LDvxbWT2tbbQ97B53yJnYU3WhH/C8ycbRAkjPDc=" crossorigin="anonymous"></script>
          </head>
          <body >
            <div
              id="MODAL_ATTACH_POINT"
              style="position: absolute; top: -20px; left: -20px; visibility: hidden; overflow: hidden; background-color: rgba(0, 0, 0, 0.4); z-index: 100;"
            ></div>
            <div style="display: flex;">
              <div style="width: 21.3%; margin-right: 9px;"> </div>
              <div style="display: flex; flex-direction: column">
                <div style="display: flex; margin: 0 0 20px 0;">
                  <div id="gallery"></div>
                  <div id="mainTitleMount"></div>
                  <div id="itemAvailability"></div>
                </div>
                <div id="RECOMMENDATIONS_CUSTOMER_ATTACH_POINT"></div>
                <div id="RECOMMENDATIONS_TREAT_ATTACH_POINT"></div>
                <div id="description" style="margin: 0 0 20px 0;">${serviceApp}</div>
                <div id="REVIEWS_ATTACH_POINT"></div>
                <div id="RECOMMENDATIONS_PET_ATTACH_POINT"></div>
              </div>
              <div style="width: 21.3%;"> </div>
              >
          </body>
        
          <script>
            const callback = function() {
              const body = document.body;
        
              let height = body.scrollHeight + 40;
              let width = body.scrollWidth + 40;
        
              const modalAttachPoint = document.getElementById("MODAL_ATTACH_POINT");
        
              modalAttachPoint.style.height = height;
              modalAttachPoint.style.width = width;
            };
        
            window.addEventListener('resize', callback);
        
            const targetNode = document.body;
            const observer = new MutationObserver(callback);
            const config = { childList: true, subtree: true, attributes: false };
            observer.observe(targetNode, config);
          </script>
        
          <script crossorigin src="http://ec2-3-19-16-18.us-east-2.compute.amazonaws.com/bundle.js" ></script>
        </html>
        `);
      })
      .catch((err) => res.send(err));
  }
});

server.listen(3000);
