const commandLineArgs = require('command-line-args');
const FileSorter = require('./FileSorter');
const ImagesToVideo = require('./ImagesToVideo');
const CacheChecker = require('./CacheChecker');

// Define the allowed command line arguments.
const optionDefinitions = [
  { name: 'directory', alias: 'd', type: String },
  { name: 'output', alias: 'o', type: String, defaultValue: './' },
  { name: 'interpolate_fps', alias: 'i', type: Number, defaultValue: null},
  { name: 'fps', alias: 'f', type: Number, defaultValue: 15}
];

// Parse the command line arguments into an object.
const options = commandLineArgs(optionDefinitions);

console.log(`Frame interpolation: ${options.interpolate_fps} fps`);
console.log(`Video FPS: ${options.fps} fps`);
console.log(`Search directory: ${options.directory}`);
console.log(`Output directory: ${options.output}`);

if(options.directory) {
  let cache = new CacheChecker.TimelapseCache(options);
  let startTime = (new Date()).getTime();

  FileSorter.fetchGroupedImages(options.directory).then((files) => {
      cache.setGroupedFiles(files);
      return cache.getGroupsNeedingRendering(files).then((renderGroups) => {
        var promises = [];
        for(var group of renderGroups) {
          promises.push(ImagesToVideo.convertImagesToVideo(files[group], options.output, group + '.mp4', options.fps, options.interpolate_fps));
        }

        return Promise.all(promises);
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
