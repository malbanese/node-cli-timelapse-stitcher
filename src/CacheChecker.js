const fs = require('fs');

/**
 * Returns a promise validating a video's cache.
 * @param  {[type]} filename The full path to the video.
 * @return {Promise} Promise that resolves with a boolean if the video was cached or not.
 */
function isVideoCached(filename) {
  return new Promise((resolve, reject) => {
    fs.stat(filename, (err, stats) => {
      resolve((err) ? false : true);
    })
  })
}

module.exports = {
  isVideoCached
};
