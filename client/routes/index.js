const express = require('express');
const router = express.Router();
const Twitter = require('twitter');
const redis = require('redis');
const AWS = require("aws-sdk");
const axios = require("axios");
require('dotenv').config();

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Init S3
const bucketName = 'cab432-twitter-assign2-store';
const S3 = new AWS.S3({ apiVersion: '2006-03-01' });

// Init redis
// const redisClient = redis.createClient({ port: 6379, host: "cab432twitterassign2.km2jzi.ng.0001.apse2.cache.amazonaws.com" });
const redisClient = redis.createClient();
redisClient.on('error', (err) => {
  console.log("Error " + err);
});

const server = 'http://ec2-13-236-10-12.ap-southeast-2.compute.amazonaws.com:3001';

/* GET home page. */
router.get('/', function (req, res, next) {
  client.get('trends/place', { id: '23424748' }, function (error, trends, response) {
    if (!error) {
      // console.log(trends[0].trends);
      res.render('index', {
        title: 'trending',
        keyword: req.params.q,
        data: trends[0].trends
      });
      res.end();
    } else {
      console.error(error);
      res.status(500).send(error);
    }
  });
});

router.get('/twitter', function (req, res, next) {
  res.render('twitterAnalysis');
});

router.get('/stream', function (req, res, next) {
  axios.get(`${server}/twitter/stream?q=${req.query.q}`)
    .then(result => {
      res.send("Old stream destroyed.");
      res.end();
    }).catch(err => {
      console.error(err);
      res.send(500);
      res.end();
    });
});

router.get('/stop', function (req, res, next) {
  axios.get(`${server}/twitter/stop`)
    .then(result => {
      res.send("Old stream destroyed.");
      res.end();
    }).catch(err => {
      console.error(err);
      res.send(500);
      res.end();
    });
});

router.post('/update', function (req, res, next) {
  S3.getObject({ Bucket: bucketName, Key: `twitter-${req.body.q}.json` }, (err, result) => {
    if (result) {
      res.json(JSON.parse(result.Body).value);
      res.end();
    } else {
      res.status(404);
      res.end();
    }
  });
});

module.exports = router;
