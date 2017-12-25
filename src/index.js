#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const FileSorter = require('./FileSorter');
const ImagesToVideo = require('./ImagesToVideo');
const CacheChecker = require('./CacheChecker');
const getUsage = require('command-line-usage');

// Define the allowed command line arguments.
const optionDefinitions = [
  { name: 'directory', alias: 'd', type: String, description:'The input directory.' },
  { name: 'output', alias: 'o', type: String, defaultValue: './', description:'The output directory.' },
  { name: 'interpolate_fps', alias: 'i', type: Number, defaultValue: null, description:'Integer value representing the final output FPS. If greater than the normal fps option, interpolation will take place. This is an expensive operation.'},
  { name: 'fps', alias: 'f', type: Number, defaultValue: 15, description:'Integer value representing the FPS output of the video. One image per frame.'},
  { name: 'ignore_cache', alias: 'c', type: Boolean, description:'Boolean value determining if the cache should be ignored.'},
  { name: 'parallel', alias: 'p', type: Number, defaultValue: 10, description:'Integer value describing the maximum parallel videos that can be created.'},
  { name: 'help', alias: 'h', type: Boolean, description:'Displays the help for this command line tool.'}
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



if(!options.directory) {
  console.log('Please provide a valid search directory.');
} else {
  console.log(`Frame interpolation: ${options.interpolate_fps} fps`);
  console.log(`Video FPS: ${options.fps} fps`);
  console.log(`Search directory: ${options.directory}`);
  console.log(`Output directory: ${options.output}`);

  let cache = new CacheChecker.TimelapseCache(options);
  let startTime = (new Date()).getTime();

  FileSorter.fetchGroupedImages(options.directory).then((files) => {
      cache.setGroupedFiles(files);
      return cache.getGroupsNeedingRendering(files).then((renderGroups) => {
        return batchedRender(options.parallel, files, renderGroups);
      });
    })
    .then((videos) => {
      if(videos.length == 0) {
        console.log('All videos were cached, skipping timelapse render.');
        return;
      }

      return ImagesToVideo.concatenateVideos(cache.getVideoArray(), options.output, 'timelapse.mp4').then(() => {
        let endTime = (new Date()).getTime();
        console.log(`Rendering complete, total time: ${endTime - startTime} ms.`);
      });
    })
    .then(() => {
      return cache.writeCacheFile();
    });
}
