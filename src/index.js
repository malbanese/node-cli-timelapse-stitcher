#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const FileSorter = require('./FileSorter');
const ImagesToVideo = require('./ImagesToVideo');
const CacheChecker = require('./CacheChecker');
const getUsage = require('command-line-usage');
const fs = require('fs');

// Define the allowed command line arguments.
const optionDefinitions = [
  { name: 'directory', alias: 'd', type: String, defaultValue: './', description:'The input directory.' },
  { name: 'output', alias: 'o', type: String, defaultValue: './timelapse', description:'The output directory.' },
  { name: 'interpolate_fps', alias: 'i', type: Number, defaultValue: null, description:'Integer value representing the final output FPS. If greater than the normal fps option, interpolation will take place. This is an expensive operation.'},
  { name: 'fps', alias: 'f', type: Number, defaultValue: 15, description:'Integer value representing the FPS output of the video. One image per frame.'},
  { name: 'ignore_cache', alias: 'c', type: Boolean, description:'Boolean value determining if the cache should be ignored.'},
  { name: 'parallel', alias: 'p', type: Number, defaultValue: 10, description:'Integer value describing the maximum parallel videos that can be created.'},
  { name: 'help', alias: 'h', type: Boolean, description:'Displays the help for this command line tool.'},
  { name: 'start_date', alias: 's', type: String, description:'Starting date of the timelapse in the standard RFC2822 format. Must start at 0:00 on the day. Example (MM-DD-YY).'},
  { name: 'end_date', alias: 'e', type: String, description:'Ending date of the timelapse in the standard RFC2822 format. Must start at 0:00 on the day. Not inclusive. Example (MM-DD-YY).'},
  { name: 'timelapse_file', alias: 't', type: String, defaultValue: 'timelapse.mp4', description:'The output file for the timelapse video.'}
];

// Pull in the options.
const options = commandLineArgs(optionDefinitions);

// Check to see if the options should be printed out.
if(options.help || process.argv.length <= 2) {
  // Generate the usage documentation.
  const usage = getUsage([
    {
      header: 'Node.js Command Line Timelapse Stitcher',
      content: 'This is a command line interface that works with a pre-installed ' +
      'version of ffmpeg. It is useful for optimally and easily stitching together ' +
      'many images into one big timelapse.'
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    },
    {
      content: 'Project home: [underline]{https://github.com/malbanese/node-cli-timelapse-stitcher}'
    }
  ])

  console.log(usage);
  return;
}

/**
 * Batched render that returns a promise that processes videos in batches.
 * Once all videos are rendered, the promise will resolve with a list of the
 * rendered files.
 * @param  {Number} maxParallel  The maximum number of renders at a time.
 * @param  {Array} files        The video image files to operate upon.
 * @param  {Array} renderGroups The groups needing rendering.
 * @param  {Array} _videos       Should be left undefined, used in recursive calls.
 * @return {Promise}              [description]
 */
function batchedRender(maxParallel, files, renderGroups, _videos) {
  // Keep track of the gigantic videos array.
  if(!Array.isArray(_videos)) {
    videos = [];
  }

  // Create promise array.
  let promises = [];
  let renderCount = maxParallel;

  // Loop through, keeping render count and length valid.
  while(renderGroups.length && renderCount--) {
    let group = renderGroups.pop();
    promises.push(ImagesToVideo.convertImagesToVideo(files[group], options.output, group + '.mp4', options.fps, options.interpolate_fps));
  }

  // Satisfy all promises.
  return Promise.all(promises).then((otherVideos) => {
    if(Array.isArray(otherVideos)) {
      _videos = videos.concat(otherVideos);
    }

    return (!renderGroups.length) ? _videos : batchedRender(maxParallel, files, renderGroups, _videos);
  });
}

/**
 * Prunes a image file array so that it is within the start and end dates, as
 * specified by the options.
 * @param {Array} files The video image files to operate upon.
 * @param {!String?} startDate The starting date string.
 * @param {!String?} endDate The ending date string.
 */
function constrictGroupedImagesToDate(startDate, endDate, files) {
  // Calculate the starting time of the timelapse.
  if(startDate) {
    var startTime = Date.parse(startDate)
    console.log(`Using start date ${startDate} -> ${startTime}`);
  }

  // Calculate the ending time of the timelapse.
  if(endDate) {
    var endTime = Date.parse(endDate);
    console.log(`Using end date ${endDate} -> ${endTime}`);
  }

  // Prune the unneeded file groups from our file array.
  for(var key in files) {
    var keyTime = parseInt(key);

    // Check to see if the key should be pruned.
    if((startTime && keyTime < startTime) || (endTime && keyTime >= endTime)) {
      delete files[key];
    }
  }
}

/**
 * Synchronously ensures the output directory.
 * @param  {String} outputDirectory The output directory to create if it does not exist.
 */
function ensureOutputDirectorySync(outputDirectory) {
  if (!fs.existsSync(outputDirectory)){
      fs.mkdirSync(outputDirectory);
  }
}

if(!options.directory) {
  console.log('Please provide a valid search directory.');
} else {
  console.log(`Frame interpolation: ${options.interpolate_fps} fps`);
  console.log(`Video FPS: ${options.fps} fps`);
  console.log(`Search directory: ${options.directory}`);
  console.log(`Output directory: ${options.output}`);
  ensureOutputDirectorySync(options.directory);

  let cache = new CacheChecker.TimelapseCache(options);
  let startTime = (new Date()).getTime();

  FileSorter.fetchGroupedImages(options.directory).then((files) => {
      // Take all grouped images, and prune them according to the start and
      // ending dates, as specified by the options.
      constrictGroupedImagesToDate(options.start_date, options.end_date, files);

      // Set the grouped files in the cache.
      cache.setGroupedFiles(files);

      // Check to see which of the group files need to be rendered.
      return cache.getGroupsNeedingRendering(files).then((renderGroups) => {
        // Dispatch a batched render of the days needing rendering.
        return batchedRender(options.parallel, files, renderGroups);
      });
    })
    .then((videos) => {
      // Check to see if anything changed, so we dont create a new timelapse
      // when it isn't really needed.
      if(videos.length == 0) {
        console.log('All videos were cached, skipping timelapse render.');
        return;
      }

      // Take all of our rendered days, and generate the timelapse video.
      console.log(options.timelapse_file);
      return ImagesToVideo.concatenateVideos(cache.getVideoArray(), options.output, options.timelapse_file).then(() => {
        let endTime = (new Date()).getTime();
        console.log(`Rendering complete, total time: ${endTime - startTime} ms.`);
      });
    })
    .then(() => {
      // Write the cache file after everything is said and done :).
      return cache.writeCacheFile();
    });
}
