const commandLineArgs = require('command-line-args');
const FileSorter = require('./FileSorter');
const ImagesToVideo = require('./ImagesToVideo');

// Define the allowed command line arguments.
const optionDefinitions = [
  { name: 'directory', alias: 'd', type: String },
  { name: 'output', alias: 'o', type: String, default: './' }
];

// Parse the command line arguments into an object.
const options = commandLineArgs(optionDefinitions);

if(options.directory) {
  FileSorter.fetchGroupedImages(options.directory)
    .then((files) => {
      var promises = [];

      for(group in files) {
        files[group].sort();
        promises.push(ImagesToVideo.convertImagesToVideo(files[group], options.output, group + '.mp4'));
      }

      return Promise.all(promises);
    }).then((videos) => {
      videos.sort();
      console.log(videos);
      ImagesToVideo.concatenateVideos(videos, options.output, 'timelapse.mp4');
    });
}
