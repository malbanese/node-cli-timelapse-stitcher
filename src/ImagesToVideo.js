const path = require('path');
const { spawn } = require('child_process');
const { exec } = require('child_process');


/**
 * Gets the FFMPEG concat input commands.
 * @param  {Array<String>} images List of image files to concat.
 * @param {String} frameDelay FFMPEG frame delay between each.
 * @return {String} The ffmpeg concat commands.
 */
function getConcatInput(images, frameDelay) {
  var command = "";
  for(var image of images) {
    command += `file '${image}'\nduration ${frameDelay}\n`
  }

  command += `file '${images[images.length-1]}'\r\n`;
  return command;
}

/**
 * Converts a list of images to a video.
 * @param  {Array<String>} images   A list of images.
 * @param  {String} path     The root output path of the video.
 * @param  {String} filename The output filename of the video.
 */
function convertImagesToVideo(images, root, filename) {
  return new Promise((resolve, reject) => {
    var outputPath = path.format({
      root:root,
      name:filename
    });

    var  options = {
      stdio: [0, 1, 2, 'ipc', 'pipe']
    };

    var concatInput = getConcatInput(images, 1/10);

    var child = exec(`ffmpeg -f concat -safe 0 -protocol_whitelist "file,pipe" -i pipe: -vsync vfr -pix_fmt yuv420p -filter "minterpolate='fps=30'" -y ${outputPath}`, options);

    child.stdin.setEncoding('utf-8');
    child.stdin.write(concatInput);
    child.stdin.end();

    child.on('exit', function (code, signal) {
      console.log(`Finished rendering ${filename}.`);
      resolve();
    });

    child.stdout.on('data', function (data) {
      console.log('stdout: ' + data.toString());
    });

    child.stderr.on('data', function (data) {
      console.log('stderr: ' + data.toString());
    });
  });
}

module.exports = {
  convertImagesToVideo
};
