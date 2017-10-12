'use strict';
var express = require('express');
var router = express.Router();
const Schedule = require('../models/schedule');

/* GET home page. */
router.get('/', function(req, res, next) {
  const title = 'フレンド予定調整くん';
  if(req.user){
    Schedule.findAll({
      where: {
        //自分の予定表の表示
        //自分が作成したものに絞り込む条件
        createdBy: req.user.id
      },
      order: '"updatedAt" DESC'
    }).then((schedules) => {
      //
      res.render('index', {
        title: title,
        user: req.user,
        schedules: schedules
      });
    });
  } else {
    res.render('index', { title: 'Express', user: req.user });
  }
});

module.exports = router;
