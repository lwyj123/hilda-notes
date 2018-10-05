const koa = require('koa');
var path = require('path');
const logger = require('koa-logger');
const views = require('koa-views')
const static = require('koa-static');
var bodyParser = require('koa-better-body');
var url = require('url');

const http = require('http');

var app = new koa();
const server = http.createServer(app.callback());

// view engine setup
app.use(views(path.join(__dirname, './views'), {
  extension: 'ejs'
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger());
app.use(bodyParser());
// app.use(require('node-sass-middleware')({
//   src: path.join(__dirname, 'public'),
//   dest: path.join(__dirname, 'public'),
//   sourceMap: true
// }));
app.use(static(path.join(__dirname, 'public')));
app.use(static(path.join(__dirname, 'node_modules/quill/dist')));
app.use(static(path.join(__dirname, 'node_modules/quill-cursors/dist')));

app.use(require('./controllers').routes());
app.use(require('./controllers').allowedMethods());

// init websockets servers
var wssShareDB = require('./helpers/wss-sharedb')(server);
var wssCursors = require('./helpers/wss-cursors')(server);

server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/sharedb') {
    wssShareDB.handleUpgrade(request, socket, head, (ws) => {
      wssShareDB.emit('connection', ws);
    });
  } else if (pathname === '/cursors') {
    wssCursors.handleUpgrade(request, socket, head, (ws) => {
      wssCursors.emit('connection', ws);
    });
  } else {
    socket.destroy();
  }
});

// catch 404 and forward to error handler
app.use(async (ctx, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  await next(err);
});

// error handler
app.use(async (ctx, next) => {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');
});

module.exports = { app: app, server: server };
