'use strict';

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
      this.onLoad();
    }

    this.image.src = url;
  }
}

class ImagesList {
  constructor({container, onChange}) {
    this.list = [];
    this.element = container;
    this.onChange = onChange;

    this.initAddImageButton();

    this.addImage();
    this.addImage();
  }

  addImage() {
    let image = {
      field: new ImageField({
        onLoad: () => this.onChange(this.getLoadedImages()),
      }),
      container: document.createElement('div'),
      removeButton: document.createElement('button')
    };

    image.container.classList.add('image-container');

    image.removeButton.innerHTML = 'Remove';
    image.removeButton.classList.add('remove-image');
    image.removeButton.addEventListener(
      'click',
      this.removeImage.bind(this, image)
    );

    image.container.appendChild(image.field.element);
    image.container.appendChild(image.removeButton);

    this.list.push(image);

    this.element.insertBefore(image.container, this.addImageButton);
  }

  removeImage(image) {
    let index = this.list.indexOf(image);
    if (index !== -1) {
      this.list.splice(index, 1);
      image.container.remove();
      this.onChange(this.getLoadedImages());
    }
  }

  getLoadedImages() {
    return this.list
      .filter((element) => element.field.loaded)
      .map((element) => element.field.image);
  }

  initAddImageButton() {
    this.addImageButton = document.createElement('button');
    this.addImageButton.innerHTML = 'Add Image';
    this.addImageButton.classList.add('add-image');

    this.addImageButton.addEventListener(
      'click',
      this.addImage.bind(this)
    );

    this.element.appendChild(this.addImageButton);
  }
}

class ConcatenationCanvas {
  constructor (container) {
    this.container = container;
    this.canvas = document.createElement('canvas');

    this.container.appendChild(this.canvas);

    this.renderingMode = 'horizontal';

    this.drawnImages = [];

    this.context = this.canvas.getContext('2d');

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
    if (!images.length) return;

    if (this.renderingMode === 'horizontal') {
      this.canvas.height = this.container.clientHeight;
      this.canvas.style.height = this.canvas.height + 'px';
    } else {
      this.canvas.width = this.container.clientWidth;
      this.canvas.style.width = this.canvas.width + 'px';
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
        imageData.width = image.naturalWidth * this.canvas.height / image.naturalHeight;
        imageData.height = this.canvas.height;
        drawnWidth += imageData.width;
      } else {
        imageData.height = image.naturalHeight * this.canvas.width / image.naturalWidth;
        imageData.width = this.canvas.width;
        drawnHeight += imageData.height;
      }

      return imageData;
    });

    if (this.renderingMode === 'horizontal') {
      this.canvas.width = drawnWidth;
      this.canvas.style.width = drawnWidth + 'px';
    } else {
      this.canvas.height = drawnHeight;
      this.canvas.style.height = drawnHeight + 'px';
    }

    calculatedImages.forEach( ({image, x, y, width, height}) => {
      this.context.drawImage(image, x, y, width, height);
    });

    this.drawnImages = images;
  }
}

function init () {
  let imagesContainer = document.getElementById('images');
  let canvasContainer = document.getElementById('canvas-container');
  let renderingModeInputs = document.querySelectorAll('input[name=rendering-mode]');

  let canvas  = new ConcatenationCanvas(canvasContainer);

  let images = new ImagesList({
    container: imagesContainer,
    onChange: (images) => canvas.drawImages(images)
  });

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

document.addEventListener("DOMContentLoaded", init);
