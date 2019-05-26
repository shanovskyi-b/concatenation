'use strict';

class ImageField {
  constructor (container, onImageLoad) {
    this.onImageLoad = onImageLoad;
    this.image = null;
    this.loaded = false;

    this.initInput(container);
  }

  initInput (container) {
    let element = document.createElement('input');
    element.setAttribute("type", "file");
    element.setAttribute("accept", "image/*");

    element.addEventListener('change', (event) => {
      let files = event.target.files;
      if (!files.length) return;
      window.URL = window.URL || window.webkitURL;
      this.createImage(window.URL.createObjectURL(files[0]));
    } , false);

    container.appendChild(element);
  }

  createImage (url) {
    this.image = new Image();
    this.image.onload = () => {
      this.loaded = true;
      this.onImageLoad();
    }
    this.image.src = url;
  }
}

// class ImagesList {
//   constructor(onImageLoad, listElement) {
//     this.list = [];
//     this.element = listElement;
//     this.onImageLoad = onImageLoad;
//   }
//
//   addImage() {
//     this.list.push(new ImageField(
//       this.onImageLoad,
//       this.element
//     ));
//     this.idCounter++;
//   }
// }

class ConcatenationCanvas {
  constructor (element) {
    this.canvas = element;
    console.log('canvas is', this.canvas.offsetHeight)
    this.canvas.height = this.canvas.offsetHeight;
    this.canvas.width = this.canvas.offsetWidth;

    this.initialSize = {
      height: this.canvas.height,
      width: this.canvas.width
    };

    this.renderingMode = 'horizontal';

    this.drawedImages = [];

    this.context = canvas.getContext('2d');
  }

  setRenderingMode (mode) {
    this.renderingMode = mode;

    this.canvas.width = this.initialSize.width;
    this.canvas.height = this.initialSize.height;
    this.canvas.style.width = this.initialSize.width + 'px';
    this.canvas.style.height = this.initialSize.height + 'px';

    this.drawImages(this.drawedImages);
  }

  updateSize (images) {
    let newSize = images.reduce( (res, image) => {
      if (this.renderingMode === 'horizontal') {
        let renderedImageWidth = image.naturalWidth * this.canvas.height / image.naturalHeight;
        res.width += renderedImageWidth;
      } else {
        let renderedImageHeight = image.naturalHeight * this.canvas.width / image.naturalWidth;
        res.height += renderedImageHeight;
      }
      return res;
    }, {width: 0, height: 0});

    if (this.renderingMode === 'horizontal') {
      this.canvas.width = newSize.width;
      this.canvas.style.width = newSize.width + 'px';
    } else {
      this.canvas.height = newSize.height;
      this.canvas.style.height = newSize.height + 'px';
    }

  }

  drawImages (images) {
    this.updateSize(images)

    let x = 0, y = 0;
    let height = this.canvas.height;
    let width = this.canvas.width;

    images.forEach( (image) => {
      if (this.renderingMode === 'horizontal') {
        let renderedImageWidth = image.naturalWidth * height / image.naturalHeight;

        this.context.drawImage(image, x, y, renderedImageWidth, height);
        x += renderedImageWidth;
      } else {
        let renderedImageHeight = image.naturalHeight * width / image.naturalWidth;

        this.context.drawImage(image, x, y, width, renderedImageHeight);
        y += renderedImageHeight;
      }
    });

    this.drawedImages = images;
  }
}

function prepareImages (images) {
  let loadedImages = images
    .filter((element) => element.loaded)
    .map((element) => element.image);

  return loadedImages;
}

function init () {
  let imagesContainer = document.getElementById('images-list');
  let canvasElement = document.getElementById('canvas');
  let renderingModeInputs = document.querySelectorAll('input[name=rendering-mode]');

  let canvas  = new ConcatenationCanvas(canvasElement);

  function createNewImage () {
    let image = new ImageField(imagesContainer, () => {
      canvas.drawImages(prepareImages(images));
    });
    return image;
  }

  let images = [
    createNewImage(),
    createNewImage()
  ];

  renderingModeInputs.forEach( (input) => {
    if (canvas.renderingMode === input.value) {
      input.checked = true;
    }

    input.addEventListener(
      'click',
      () => {
        if (canvas.renderingMode !== input.value) {
          canvas.setRenderingMode(input.value);
        }
      }
    );
  });
  // let images = new ImagesList(canvas.drawImage.bind(canvas), imagesElement);
  // images.addImage();
  // images.addImage();
}

document.addEventListener("DOMContentLoaded", init);
