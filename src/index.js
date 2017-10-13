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
      for(group in files) {
        ImagesToVideo.convertImagesToVideo(files[group], options.output, group + '.mp4');
      }
    });
}
