const fs = require('fs-extra');
const hash = require('string-hash');
const path = require('path');
const deepEqual = require('deep-equal');

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

/**
 * Class used to keep track of, and verify timelapse image caches.
 */
class TimelapseCache {
  constructor(options) {
    this.options = options;
    this.groupedFiles = [];
  }

  /**
   * Returns the output filepath to save this cache.
   */
  getOutputPath() {
    return path.format({
      root:this.options.output,
      name:'.timelapseCache'
    });
  }

  /**
   * Gets a new copy of the cache object which this represents.
   */
  getCacheObject() {
    return {
      'options': this.options,
      'groupedFiles': this.groupedFiles
    }
  }

  /**
   * Uses an object of grouped files to generate a hashed group object.
   */
  setGroupedFiles(groupedFiles) {
    var keys = Object.keys(groupedFiles);

    this.groupedFiles = {};
    for(let key of keys) {
      this.groupedFiles[key] = hash(groupedFiles[key].toString());
    }
  }

/**
 * @returns An array of timelapse videos.
 */
  getVideoArray() {
    return Object.keys(this.groupedFiles).map((file) => {
      return path.format({
        root:this.options.output,
        name:`${file}.mp4`
      });
    }).sort();
  }

  /**
   * @returns A promise which will return with the previous cache file, or
   * null if it does not exist.
   */
  getPreviousCacheFilePromise() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.getOutputPath(), (err, data) => {
        if(err) {
          return resolve(null);
        }

        try {
          resolve(JSON.parse(data.toString()));
        } catch(err) {
          resolve(null);
        }
      });
    });
  }

  /**
   * @returns A promise which resolves with the groups that need to be rendered.
   */
  getGroupsNeedingRendering(cache) {
    return this.getPreviousCacheFilePromise().then((cache) => {
      var currentGroupKeys = Object.keys(this.groupedFiles);

      if(this.options.ignore_cache) {
        console.log('Ignoring cache...');
        return currentGroupKeys;
      }

      if(!cache) {
        console.log('No previous cache...');
        return currentGroupKeys;
      }

      if(!deepEqual(this.options, cache.options)) {
        console.log('Options are different from the previous render, dumping cache...');
        return currentGroupKeys;
      }

      // Build array needed for tracking rendering targets.
      var needsRendering = [];

      // Iterate through, figuring out what needs to be rendered again.
      for(let key of currentGroupKeys) {
        if(this.groupedFiles[key] === cache.groupedFiles[key]) {
          console.log(`${key} is cached, skipping...`);
        } else {
          needsRendering.push(key);
        }
      }

      return new Promise((resolve, reject) => {
        resolve(needsRendering);
      });
    });
  }

  /**
   * Writes the cache file to the disk, returns a promise that will resolve
   * when the writing operation has completed.
   */
  writeCacheFile() {
    return new Promise((resolve, reject) => {
      fs.outputFile(this.getOutputPath(), JSON.stringify(this.getCacheObject()), (err) => {
        if(err) {
          return reject(err);
        }

        resolve();
      })
    });
  }
}

module.exports = {
  isVideoCached,
  TimelapseCache
};
