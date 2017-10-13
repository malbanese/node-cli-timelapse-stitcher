const glob = require('glob');
const fs = require('fs');
const timezoneOffsetMS = new Date().getTimezoneOffset() * 60 * 1000;

/**
 * Fetches a list of files from the provided path.
 * @param  {String} root The base path to grab the files from.
 * @return {Promise} Promise that resolves with the list of files at the directory.
 */
function fetchFileNames(root) {
  return new Promise((resolve, reject) => {
    glob(`**/*.{png,gif,jpg,jpeg}`, {cwd:root, absolute:true}, (err,files) => {
      if(err) {
        return reject(err);
      }

      resolve(files);
    })
  });
}

/**
 * Groups files by the day that they were created.
 * @param  {[type]} files [description]
 * @return {[type]}       [description]
 */
function groupFilesByDay(files) {
  var promises = [];
  var fileMap = {};

  for(let file of files) {
    promises.push(new Promise((resolve, reject) => {
      fs.stat(file, (err, stats) => {
        if(err) {
          return reject(err);
        }
        var roundedTimestamp = roundTimestampToDay(stats.ctime);

        if(!fileMap[roundedTimestamp]) {
          fileMap[roundedTimestamp] = [];
        }

        fileMap[roundedTimestamp].push(file);
        resolve();
      });
    }));
  }

  return Promise.all(promises).then(() => {
    return fileMap;
  });
}

/**
 * Rounds a timestamp to the day it was taken on.
 * @param  {Number} timestamp The timestamp to round down.
 * @return {Number}           The rounded timestamp.
 */
function roundTimestampToDay(timestamp) {
  timestamp -= timestamp % (24 * 60 * 60 * 1000);
  return timestamp + timezoneOffsetMS;
}

/**
 * Used to get a list of image files grouped by day.
 * @param  {String} root The base file path to search from.
 * @return {Promise} Promise that resolves with a keyed object, where each
 * key is a timestamp with an array of files from the day.
 */
function fetchGroupedImages(root) {
  return new Promise((resolve, reject) => {
    fetchFileNames(root).then((files) => {
      groupFilesByDay(files).then((sortedFiles) => {
        resolve(sortedFiles);
      })
    });
  });
};

module.exports = {
  fetchGroupedImages
};
