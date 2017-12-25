# node-cli-timelapse-stitcher

Node.js Command Line Timelapse Stitcher

  This is a command line interface that works with a pre-installed version of
  ffmpeg. It is useful for optimally and easily stitching together many images
  into one big timelapse.

Options

  -d, --directory string         The input directory.

  -o, --output string            The output directory.

  -i, --interpolate_fps number   Integer value representing the final output FPS. If greater
                                 than the normal fps option, interpolation will take place.
                                 This is an expensive operation.

  -f, --fps number               Integer value representing the FPS output of the video. One
                                 image per frame.

  -c, --ignore_cache             Boolean value determining if the cache should be ignored.

  -p, --parallel number          Integer value describing the maximum parallel videos that can
                                 be created.

  -h, --help                     Displays the help for this command line tool.

  -s, --start_date string        Starting date of the timelapse in the standard RFC2822
                                 format. Must start at 0:00 on the day. Example (MM-DD-YY).

  -e, --end_date string          Ending date of the timelapse in the standard RFC2822 format.
                                 Must start at 0:00 on the day. Not inclusive. Example (MM-DD-
                                 YY).

  Project home: https://github.com/malbanese/node-cli-timelapse-stitcher
