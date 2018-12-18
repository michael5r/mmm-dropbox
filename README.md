# Module: mmm-dropbox

The `mmm-dropbox` module is a [MagicMirror](https://github.com/MichMich/MagicMirror) addon.

This module takes images from a [Dropbox](https://www.dropbox.com) folder, scales & formats them nicely, and then displays them in organized rows on your Magic Mirror.

This module has a very specific target audience - my wife. She wanted an easy way for her & our daughter to upload photos of our cat to Dropbox and then see them on her mirror. So ... if you're looking for a module with endless configurations, tons of design options and the ability to handle videos, well, this isn't it. Sorry.

What this module does allow you to do, however, is to:
- pick a Dropbox folder to load images (`.jpg`, `.jpeg`, `.gif` and `.png`) from
- control how many rows of images you'd like to see
- control the base number of images you'd like to see per row
- select whether the images are randomly sorted or displayed newest first
- gaze in amazement at endless cat photos nicely lined up next to each other

![image](https://user-images.githubusercontent.com/3209660/50133914-5437e080-0253-11e9-90dd-681a31c68a71.png)
*An example of this module using the default configuration.*


## Installing the module

1) Run `git clone https://github.com/michael5r/mmm-dropbox.git` from inside your `MagicMirror/modules` folder.
2) Run `cd mmm-dropbox` in the same terminal window, then `npm install` to install the required Node modules.


## Getting the Dropbox Access Token
In order for you to access your Dropbox folder through your mirror, you need a [Dropbox developer account](https://www.dropbox.com/developers) and to set up a simple Dropbox app.

- go to the site above and either login with your existing Dropbox user or create a new one
- click the `Create App` button
- choose the `Dropbox API`
- choose the type of access you want (either will work)
- name your app
- click `Create App`

On the next page, look for the area where it says `Generated access token` and click `Generate` underneath it. Copy that token and add it to the configuration settings of this module.


## Using the module
To use this module, simply add it to the `modules` array in the MagicMirror `config/config.js` file:

```js
{
    module: 'mmm-dropbox',
    position: 'bottom_bar', // pick whichever position you want
    config: {
        token: '<DROPBOX_ACCESS_TOKEN>',
        folder: '<DROPBOX_FOLDER_NAME>',
        // ... and whatever else configuration options you want to use
    }
},
```


## General Configuration Options

Option               | Type      | Default   | Description
---------------------|-----------|-----------|-------------------------------------------------------------
`token`              | `string`  | -         | **This value is required for this module to work.**
`folder`             | `string`  |           | Which Dropbox folder to pull images from. [Read more](#folder)
`imagesPerRow`       | `int`     | `4`       | Base number of images per row. [Read more](#images-per-row)
`imagesMargin`       | `int`     | `10`      | How much blank space you want around the images in pixels.
`numberOfRows`       | `int`     | `2`       | How many rows of images you wish to display.
`rowType`            | `string`  | `wife`    | One of: 'wife', 'newest', 'random'. [Read more](#row-types)
`dataUpdateInterval` | `int`     | `2.16e+7` | How often to load new data from Dropbox, default is every 6 hours.
`updateInterval`     | `int`     | `300000`  | How often to refresh your photos on the mirror, default is every 5 minutes.
`initialLoadDelay`   | `int`     | `0`       | How long to delay the initial load (in ms)


## Folder

If you set the `folder` option blank, your images will be pulled from the root of your `Dropbox` account. If you'd rather have a specific folder to pull images from, create a new Dropbox folder and add the name to the `folder` setting.


## Images Per Row

Seeing that photos come in all shapes & sizes, the `imagesPerRow` setting doesn't guarantee that you'll get exactly that number of images shown per row (because it would be impossible to line things up nicely that way).

You should think of this setting as your baseline - meaning that if you set it to `4`, you could potentially get 3, 4, or 5 images per row, depending on whether they're landscape or portrait photos, but, if possible, you will get 4.


## Row Types

The `rowType` option is by default set to `wife` - which means that your first row of photos will be the newest photos you've uploaded and any other rows will be random images pulled from your total pool of photos. It is named this way because, well, that's what my wife wanted. Your other options are `newest` (all images are shown in chronological order) or `random` (all images are shown in random order).


## FAQ

### Why is the dataUpdateInterval set to 6 hours? That seems long ...

This module grabs up to 200 images from Dropbox every time it does a data pull, so it didn't seem necessary to get data that often. Feel free to change it if you have an urgent desire to get new images non-stop.

Don't confuse this setting with `updateInterval`, though - the `updateInterval` setting (which, by default, is set to 5 minutes) selects how often you want your mirror to show new images.

### Even with the rowType set to newest, I'm still seeing old photos.

If possible, this module will try to read the metadata of your photo to determine when it was actually taken. However, whether your photo has this metadata or not depends entirely on the camera or phone you used to take the photo with (and the security settings of said device). As such, if the metadata cannot be found, the module will default to using the date & time the image was uploaded to Dropbox instead.