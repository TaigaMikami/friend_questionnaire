var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet');

var session = require('express-session');
var passport = require('passport');

var User = require('./models/user');
var Schedule = require('./models/schedule');
var Availability = require('./models/availability');
var Candidate = require('./models/candidate');
var Comment = require('./models/comment');

User.sync().then(() => { //sync 関数というモデルに合わせてデータベースのテーブルを作成する関数
  //予定がユーザーの従属エンティティであることを定義
  Schedule.belongsTo(User, {foreignKey: 'createdBy'});
  Schedule.sync();
  //コメントがユーザーに従属していることの定義
  Comment.belongsTo(User, {foreignKey: 'userId'});
  Comment.sync();
  //出欠がユーザーに従属している
  Availability.belongsTo(User, {foreignKey: 'userId'});
  Candidate.sync().then(() => {
    Availability.belongsTo(Candidate, {foreignKey: 'candidateId'});
    Availability.sync();
  });

})
var GitHubStrategy = require('passport-github2').Strategy;

var GITHUB_CLIENT_ID = '98976f31becfc3e9e1e6';
var GITHUB_CLIENT_SECRET = '20d1e87cc29b3cac0a6d050067e11ed38a7b6762';

//ユーザー情報をデータとして保存する処理
passport.serializeUser(function (user, done) {
  done(null, user);
});

//保存されたデータをユーザーの情報として読み出す際の処理
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:8000/auth/github/callback'
},
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.upsert({
        userId: profile.id,
        username: profile.username
      }).then(() => {
        done(null, profile);
      });
    });
  }
));

var routes = require('./routes/index');
var login = require('./routes/login');
var logout = require('./routes/logout');
var schedules = require('./routes/schedules');

var app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'b421053efc766581', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/login', login);
app.use('/logout', logout);
app.use('/schedules', schedules);

app.get('/auth/github',
 passport.authenticate('github', { scope: ['user:email'] }),
 function (req, res) {
});

app.get('/auth/github/callback',
 passport.authenticate('github', { failureRedirect: '/login' }),
 function (req, res) {
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
