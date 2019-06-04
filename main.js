'use strict';

document.addEventListener("DOMContentLoaded", init);

function init () {
  let imagesContainer = document.getElementById('images');
  let canvasContainer = document.getElementById('canvas-container');

  let canvas  = new ConcatenationCanvas(canvasContainer);

  let images = new ImagesList({
    container: imagesContainer,
    onChange: (images) => canvas.drawImages(images)
  });

  setupRenderingModeControls(canvas);
}

function setupRenderingModeControls (canvas) {
  let renderingModeInputs = document.querySelectorAll('input[name=rendering-mode]');

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
}

class ConcatenationCanvas {
  constructor (container) {
    this.container = container;
    this.renderingMode = 'horizontal';
    this.drawnImages = [];

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.container.appendChild(this.canvas);

    const containerResizeOnserver = new ResizeObserver( (container) => {
      if (this.drawnImages) {
        this.drawImages(this.drawnImages);
      }
    })
    containerResizeOnserver.observe(this.container);
  }

  setRenderingMode (mode) {
    this.renderingMode = mode;
    this.drawImages(this.drawnImages);
  }

  drawImages (images) {
    if (!images.length) {
      if (this.drawnImages.length) {
        this.drawnImages = [];
        this.clear();
      }
      return;
    }

    if (this.renderingMode === 'horizontal') {
      this.setHeight(this.container.clientHeight);
    } else {
      this.setWidth(this.container.clientWidth)
    }

    let drawnWidth = 0, drawnHeight = 0;

    // prepare images for drawing, calculate canvas new size
    let calculatedImages = images.map( (image) => {
      let imageData = {
        image,
        x: drawnWidth,
        y: drawnHeight,
      };

      if (this.renderingMode === 'horizontal') {
        imageData.height = this.canvas.height;
        imageData.width = image.naturalWidth * imageData.height / image.naturalHeight;

        drawnWidth += imageData.width;
      } else {
        imageData.width = this.canvas.width;
        imageData.height = image.naturalHeight * imageData.width / image.naturalWidth;

        drawnHeight += imageData.height;
      }

      return imageData;
    });

    // change canvas size depending to images sizes
    if (this.renderingMode === 'horizontal') {
      this.setWidth(drawnWidth);
    } else {
      this.setHeight(drawnHeight)
    }

    calculatedImages.forEach( ({image, x, y, width, height}) => {
      this.context.drawImage(image, x, y, width, height);
    });

    this.drawnImages = images;
  }

  clear () {
    this.setHeight(this.container.clientHeight);
    this.setWidth(this.container.clientWidth);
  }

  setHeight (height) {
    this.canvas.height = height;
    this.canvas.style.height = height + 'px';
  }

  setWidth (width) {
    this.canvas.width = width;
    this.canvas.style.width = width + 'px';
  }
}

class ImagesList {
  constructor ({container, onChange}) {
    this.list = [];
    this.element = container;
    this.onChange = onChange;

    this.initAddImageButton();

    this.addImage();
    this.addImage();
  }

  initAddImageButton () {
    this.addImageButton = document.createElement('button');
    this.addImageButton.innerHTML = 'Add Image';
    this.addImageButton.classList.add('add-image');

    this.addImageButton.addEventListener(
      'click',
      this.addImage.bind(this)
    );

    this.element.appendChild(this.addImageButton);
  }

  addImage () {
    let image = this.createNewImage();

    this.list.push(image);
    this.element.insertBefore(image.container, this.addImageButton);
  }

  createNewImage () {
    let container = document.createElement('div');
    container.classList.add('image');

    let label = document.createElement('label');
    label.innerHTML = '+';
    label.classList.add('image__label');

    let removeButton = document.createElement('button');
    removeButton.innerHTML = 'x';
    removeButton.classList.add('image__remover');

    container.appendChild(label);
    container.appendChild(removeButton);

    let image = {
      container: container,

      field: new ImageField({
        onLoad: (imageField) => {
          label.style.backgroundImage = "url('" + imageField.image.currentSrc + "')";
          label.innerHTML = '';

          this.onChange(this.getLoadedImages());
        },
      })
    };

    removeButton.addEventListener(
      'click',
      () => this.removeImage(image)
    );

    label.appendChild(image.field.element);

    return image;
  }

  removeImage (image) {
    let index = this.list.indexOf(image);
    if (index !== -1) {
      this.list.splice(index, 1);
      image.container.remove();
      this.onChange(this.getLoadedImages());
    }
  }

  getLoadedImages () {
    return this.list
      .filter((element) => element.field.loaded)
      .map((element) => element.field.image);
  }
}

class ImageField {
  constructor ({onLoad}) {
    this.onLoad = onLoad;
    this.image = null;
    this.loaded = false;

    this.initInput();
  }

  initInput () {
    this.element = document.createElement('input');
    this.element.setAttribute("type", "file");
    this.element.setAttribute("accept", "image/*");
    this.element.addEventListener(
      'change',
      this.handleInputChange.bind(this)
    );
  }

  handleInputChange (event) {
    let files = event.target.files;

    if (!files.length) return;

    window.URL = window.URL || window.webkitURL;
    this.createImage(window.URL.createObjectURL(files[0]));
  }

  createImage (url) {
    this.image = new Image();

    this.image.onload = () => {
      this.loaded = true;
      this.onLoad(this);
    }

    this.image.src = url;
  }
}
