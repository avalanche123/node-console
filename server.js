var http = require('http')
  , io = require('socket.io')
  , fs = require('fs')
  , spawn = require('child_process').spawn;

var app = http.createServer(function(req, res) {
  [ 
      '/index.html'
    , '/js/jquery.terminal.min.js'
    , '/css/jquery.terminal.css'
  ].forEach(function(file) {
    if (file === req.url) {
      var parts = file.split('.');
      res.setHeader('Content-Type', 'text/'+{js: 'javascript', html: 'html', css: 'css'}[parts[parts.length - 1]])
      fs.readFile(__dirname + file, function (err, data) {
        res.setHeader('Content-Length', data.length);
        res.writeHead(200);
        res.end(data);
      });
    }
  })
});

app.listen(8080);

io.listen(app).sockets.on('connection', function (socket) {
  var shell = spawn('/bin/bash')
    , stdin = shell.stdin;

  shell.on('exit', function() {
    socket.disconnect();
  })

  ['stdout', 'stderr'].forEach(function(stream) {
    shell[stream].setEncoding('ascii');
    shell[stream].on('data', function(data) {
      socket.emit(stream, data);
    })
  });

  socket.on('stdin', function(command) {
    stdin.write(command+"\n") || socket.emit('disable');
  });

  stdin.on('drain', function() {
    socket.emit('enable');
  });

  stdin.on('error', function(exception) {
    socket.emit('error', String(exception));
  });
});