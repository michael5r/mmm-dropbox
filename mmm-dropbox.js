/* Magic Mirror
 * Module: mmm-dropbox
 *
 * By Michael Schmidt
 * https://github.com/michael5r
 *
 * MIT Licensed.
 */

Module.register("mmm-dropbox", {

	defaults: {
		folder: "", // which folder to be scanned, defaults to root
		imagesPerRow: 4, // base number of images pr. row
		imagesMargin: 10, // eg. 10px
		numberOfRows: 2, // how many rows of images to show
		rowType: "wife", // how to sort images in every row
		dataUpdateInterval: 6 * 60 * 60 * 1000, // every 6 hours
		updateInterval: 5 * 60 * 1000, // every 5 minutes
		animationSpeed: 2 * 1000,
		initialLoadDelay: 0,
		version: "2.0.0"
	},

	getStyles () {
		return ["mmm-dropbox.css"];
	},

	start () {

		Log.info(`Starting module: ${this.name}, version ${this.config.version}`);

		this.errMsg = "";

		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.files = [];

	},

	getDom () {

		var outer_wrapper = document.createElement("div");

		// show error message
		if (this.errMsg !== "") {
			outer_wrapper.innerHTML = this.errMsg;
			outer_wrapper.className = "normal regular small";
			return outer_wrapper;
		}

		// show loading message
		if (!this.loaded) {
			outer_wrapper.innerHTML = "Loading ...";
			outer_wrapper.className = "bright light small";
			return outer_wrapper;
		}

		if ((this.loaded) && (this.files.length > 0)) {
			outer_wrapper.className = "dropbox-wrapper";
			var view = this.renderView();
			outer_wrapper.appendChild(view);
		}

		return outer_wrapper;

	},

	getData () {
		this.sendSocketNotification("MMM_DROPBOX_GET");
	},

	notificationReceived (notification, payload, sender) {

		if (notification === "MODULE_DOM_CREATED") {
			if (this.config.appKey === "" || this.config.appSecret === "") {
				this.errMsg = "Please add your Dropbox App key and App secret to the MagicMirror config.js file.";
				this.updateDom(this.config.animationSpeed);
			} else {
				this.sendSocketNotification("MMM_DROPBOX_INIT", this.config);
			}
		}

	},

	socketNotificationReceived (notification, payload) {

		if (notification === "MMM_DROPBOX_FILES") {

			if (payload.length > 0) {

				// only use files that have been saved
				var savedFiles = payload.filter(function (obj) { return obj.saved; });

				// sort the files based on time taken
				if (savedFiles.length > 0) {
					savedFiles.sort((a, b) => b.time_taken.localeCompare(a.time_taken));
					this.files = savedFiles;
					if (!this.loaded) {
						this.loaded = true;
					}
				}
			}

			this.updateDom(this.config.animationSpeed);

		} else if (notification === "MMM_DROPBOX_ERROR") {
			this.errMsg = payload;
			this.updateDom(this.config.animationSpeed);
		}

	},

	renderView () {

		var outerWrapper = document.createElement("div");

		var files = this.files;
		var filesRandom = files.slice(0);
		filesRandom.sort(function () { return Math.random() - 0.5; });

		var numberOfRows = parseInt(this.config.numberOfRows) > 1 ? parseInt(this.config.numberOfRows) : 1; // we always want one row
		var rowType = this.config.rowType;

		if ((rowType !== "newest") && (rowType !== "random") && (rowType !== "wife")) {
			rowType = "wife";
		}

		var filesOffset = 0;

		for (var i = 0; i < numberOfRows; i++) {

			if (rowType === "newest") {

				var row = this.getRow(files, i, filesOffset);
				if (row) {
					outerWrapper.appendChild(row.row);
					filesOffset += 1 + row.offset;
				}


			} else if (rowType === "random") {

				var row = this.getRow(filesRandom, i, filesOffset);
				if (row) {
					outerWrapper.appendChild(row.row);
					filesOffset += 1 + row.offset;
				}

			} else {
				// wife mode

				if (i === 0) {

					var row = this.getRow(files, i, 0);
					if (row) {
						outerWrapper.appendChild(row.row);
						filesOffset += 1 + row.offset;
					}

				} else {

					if (i === 1) {
						filesRandom = files.slice(filesOffset);
						filesRandom.sort(function () { return Math.random() - 0.5; });
						filesOffset = 0;
					}

					var row = this.getRow(filesRandom, i, filesOffset);
					if (row) {
						outerWrapper.appendChild(row.row);
						filesOffset += 1 + row.offset;
					}

				}

			}
		}

		return outerWrapper;

	},

	getRow (files, pos, start) {

		/*
            We're using the w480h320 size with the strict mode for the thumbnails.

            What this means is that images will most likely be scaled down to a 320px height with a 480px-or-less width,
            but they can also be scaled down to a 480px width (if the image is very narrow) with a 320px-or-less height.

            Default portrait images end up a 240px (w) x 320px (h) image - we use this ratio to calculate stuff with.

            Based on imagesPerRow, imagesMargin and the outer width of the container, we can then calculate the height images need to be set to in order to ensure
            that either X, X-1 or X+1 number of images fit in a row.

        */

		if ((files.length < 1) || (files.length < start)) {
			return false;
		}

		var row = document.createElement("div");

		var images = [];
		var imagesPerRow = parseInt(this.config.imagesPerRow);
		var imagesPerRowPlus = imagesPerRow + 1;
		var imagesPerRowMinus = imagesPerRow > 1 ? imagesPerRow - 1 : 1;
		var imagesMargin = parseInt(this.config.imagesMargin);
		var outerWidth = document.querySelector(".module.mmm-dropbox .module-content").offsetWidth; // 960
		var baseHeightToWidthRatio = ((100 / 240) * 320) / 100; // 1.3333

		// calculate the height that images should be if we were to fit X number of
		// default portrait images into a single row
		var baseWidth = (outerWidth - ((imagesMargin * 2) * (imagesPerRow - 1))) / imagesPerRow;
		var baseHeight = baseHeightToWidthRatio * baseWidth;

		// do the same for imagesPerRow + 1
		var basePlusWidth = (outerWidth - ((imagesMargin * 2) * (imagesPerRowPlus - 1))) / imagesPerRowPlus;
		var basePlusHeight = baseHeightToWidthRatio * basePlusWidth;

		// and imagesPerRow - 1
		var baseMinusWidth = (outerWidth - ((imagesMargin * 2) * (imagesPerRowMinus - 1))) / imagesPerRowMinus;
		var baseMinusHeight = baseHeightToWidthRatio * baseMinusWidth;

		var totalW = 0 - (imagesMargin * 2); // because the left and right margins will be absorbed by the outher container
		var totalPlusW = totalW;
		var totalMinusW = totalW;
		var offsetMod = 0; // in case we remove images

		for (var i = start; i < files.length; i++) {

			var file = files[i];
			var fileW = file.width;
			var fileH = file.height;
			var portrait = fileH > fileW;

			// only show image if it has a width or height property
			if ((fileW > 0) && (fileH > 0)) {

				// figure out the size ratio between width & height
				// for portrait this is > 1.00, for landscape this is < 1.00
				// var fileHeightToWidthRatio = ((100/fileW) * fileH / 100);

				// figure out what the width of this file would be if it's using the various heights
				var fileScaledW = Math.floor(fileW / (fileH / baseHeight));
				var filePlusScaledW = Math.floor(fileW / (fileH / basePlusHeight));
				var fileMinusScaledW = Math.floor(fileW / (fileH / baseMinusHeight));

				// push values
				totalW += (fileScaledW + (2 * imagesMargin));
				totalPlusW += (filePlusScaledW + (2 * imagesMargin));
				totalMinusW += (fileMinusScaledW + (2 * imagesMargin));

				// push to temp array
				images.push({
					name: file.name,
					base: totalW <= (outerWidth + fileScaledW + (2 * imagesMargin)),
					plus: totalPlusW <= (outerWidth + filePlusScaledW + (2 * imagesMargin)),
					minus: totalMinusW <= (outerWidth + fileMinusScaledW + (2 * imagesMargin)),
					w: fileW,
					h: fileH
				});

				if ((totalW > outerWidth) && (totalPlusW > outerWidth) && (totalMinusW > outerWidth)) {
					// we've found the images we needed
					break;
				}

			} else {
				offsetMod++;
			}

		}

		// figure out which model is closest to the outerWidth size
		var closest = [totalW, totalPlusW, totalMinusW].reduce(function (prev, curr) {
			return (Math.abs(curr - outerWidth) < Math.abs(prev - outerWidth) ? curr : prev);
		});

		var offset = 0;
		var imgModel = "base";
		var imgHeight = baseHeight;

		if (closest === totalPlusW) {
			imgModel = "plus";
			imgHeight = basePlusHeight;
		} else if (closest === totalMinusW) {
			imgModel = "minus";
			imgHeight = baseMinusHeight;
		}

		// we need to know how many images we'll actually end up showing
		var imagesToBeShown = 0;
		for (var j = 0; j < images.length; j++) {
			var image = images[j];
			if ((imgModel === "base" && image.base) || (imgModel === "plus" && image.plus) || (imgModel === "minus" && image.minus)) {
				imagesToBeShown++;
			}
		}

		var rowRealWidth = 0;
		var rowFull = true;

		if (closest > outerWidth) {
			// need to reduce the height of the images to make them fit
			var marginModifier = (imagesToBeShown - 1) * (imagesMargin * 2);
			var heightModifier = (100 / (closest - marginModifier) * (outerWidth - marginModifier)) / 100;
			imgHeight = Math.floor(imgHeight * heightModifier);
		} else if (closest < outerWidth) {
			// we don't have enough images to fill up this row
			rowFull = false;
			imgHeight = Math.floor(imgHeight);
		} else {
			imgHeight = Math.floor(imgHeight);
		}

		// loop through array again
		for (var j = 0; j < images.length; j++) {

			var image = images[j];

			if ((imgModel === "base" && image.base) || (imgModel === "plus" && image.plus) || (imgModel === "minus" && image.minus)) {

				// due to the images only being scaled in one direction, there's a good chance we'll end up being off
				// on the row width by a couple of pixels - let's fix this, so everything lines up nicely

				var imgRealWidth = Math.ceil(((100 / image.h * imgHeight) / 100) * image.w);
				rowRealWidth += imgRealWidth;

				if ((j === (images.length - 1)) && (rowFull)) {
					// we're on the last image
					rowRealWidth = rowRealWidth + ((imagesToBeShown - 1) * (imagesMargin * 2));
					if (rowRealWidth < outerWidth) {
						imgRealWidth = imgRealWidth + (outerWidth - rowRealWidth);
					} else if (rowRealWidth > outerWidth) {
						imgRealWidth = imgRealWidth - (rowRealWidth - outerWidth);
					}
				}

				var img = document.createElement("img");
				img.setAttribute("src", `modules/mmm-dropbox/image_cache/${image.name}`);
				img.setAttribute("style", `margin: ${imagesMargin}px; height: ${Math.floor(imgHeight)}px; width: ${imgRealWidth}px;`);
				row.appendChild(img);
				offset = j;

			}

		}

		// set row attributes
		var rowMarginMod = pos > 0 ? ` margin-top: ${2 * imagesMargin}px;` : "";
		row.className = `inner row-${pos}`;
		row.setAttribute("style", `height: ${Math.floor(imgHeight) + imagesMargin}px; margin: ${0 - imagesMargin}px;${rowMarginMod}`);
		offset = offset + offsetMod;

		return {
			row,
			offset
		};

	},

	isString (val) {
		return typeof val === "string" || val instanceof String;
	},

	isArray (val) {
		return Array.isArray(val);
	},

	scheduleUpdate (delay) {

		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function () {
			self.getData();
		}, nextLoad);
	}

});
