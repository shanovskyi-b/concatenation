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

    this.element.addEventListener('change', (event) => {
      let files = event.target.files;
      if (!files.length) return;
      window.URL = window.URL || window.webkitURL;
      this.createImage(window.URL.createObjectURL(files[0]));
    } , false);
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
      () => this.removeImage(image)
    );

    image.container.appendChild(image.field.element);
    image.container.appendChild(image.removeButton);

    this.list.push(image);

    this.element.insertBefore(image.container, this.addImageButton);
  }

  getLoadedImages() {
    console.log('here', this.list
      .filter((element) => element.field.loaded)
      .map((element) => element.field.image)
    )
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
      () => this.addImage()
    );

    this.element.appendChild(this.addImageButton);
  }

  removeImage(image) {
    let index = this.list.indexOf(image);
    if (index !== -1) {
      this.list.splice(index, 1);
      image.container.remove();
      this.onChange(this.getLoadedImages());
    }
  }
}

class ConcatenationCanvas {
  constructor (element) {
    this.canvas = element;

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

function init () {
  let imagesContainer = document.getElementById('images');
  let canvasElement = document.getElementById('canvas');
  let renderingModeInputs = document.querySelectorAll('input[name=rendering-mode]');

  let canvas  = new ConcatenationCanvas(canvasElement);

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

  let images = new ImagesList({
    container: imagesContainer,
    onChange: (images) => canvas.drawImages(images)
  });
}

document.addEventListener("DOMContentLoaded", init);
