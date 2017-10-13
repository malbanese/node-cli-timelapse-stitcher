const commandLineArgs = require('command-line-args');
const FileSorter = require('./FileSorter');
const ImagesToVideo = require('./ImagesToVideo');

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
  FileSorter.fetchGroupedImages(options.directory)
    .then((files) => {
      var promises = [];

      for(group in files) {
        promises.push(ImagesToVideo.convertImagesToVideo(files[group].sort(), options.output, group + '.mp4', options.fps, options.interpolate_fps));
      }

      return Promise.all(promises);
    }).then((videos) => {
      ImagesToVideo.concatenateVideos(videos.sort(), options.output, 'timelapse.mp4');
    });
}
