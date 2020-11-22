import { ModalLayer } from './node_modules/vanilla-modal-layer';
export class EditContent {
  constructor(config) {
    this.config = config || {};
    this.editableElements = ['DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5'];

    let errors = false;
    if (!this.config.page) {
      console.warn('page not defined');
      errors = true;
    }
    if (!errors) {
      this.initEdition();
    }
    this.data = [];
    this.modalLayer = new ModalLayer();
  }

  bindEventsMethods() {
    this.keyDown = this.keyDown.bind(this);
    this.editImage = this.editImage.bind(this);
    this.editLink = this.editLink.bind(this);
    this.addElement = this.addElement.bind(this);
    this.liBlur = this.liBlur.bind(this);
  }

  getAllDataIds() {
    const allElements = [...document.getElementById('target').querySelectorAll('* > [data-id]:not(li)')];
    const someElements = allElements.filter((element) => {
      return !element.parentNode.dataset.id;
    });
    someElements.forEach((element) => {
      if (this.editableElements.includes(element.tagName)) {
        this.data[element.dataset.id] = element.innerHTML;
      } else if(element.tagName === 'IMG') {
        this.data[element.dataset.id] = element.src;
      } else if(element.tagName === 'A') {
        this.data[element.dataset.id] = element.href;
      } else {
        this.data[element.dataset.id] = [];
        const children = [...element.querySelectorAll('* > [data-id]')];
        children.forEach((child) => {
          if (child.dataset.id == parseInt(child.dataset.id)) {
            const grandSons = [...child.querySelectorAll('*')];
            if (grandSons.length > 0) {
              this.data[element.dataset.id][child.dataset.id] = {};
              grandSons.forEach((grandSon) => { 
                if(grandSon.tagName === 'A') {
                  this.data[element.dataset.id][child.dataset.id] = grandSon.href;
                } else {
                  this.data[element.dataset.id][child.dataset.id][grandSon.dataset.id] = grandSon.innerHTML;
                }
              });
            } else {
              this.data[element.dataset.id][child.dataset.id] = child.innerHTML;
            }
          }
        });
      }
    });
    // console.log(this.data);
  }

  saveDatabase() {

  }

  createWorkLayers() {
    this.commands = document.createElement('div');
    this.commands.id = 'commands';
    this.commands.innerHTML = 'COMMANDS';
    document.body.appendChild(this.commands);

    this.target = document.createElement('div');
    this.target.id = 'target';
    document.body.appendChild(this.target);
  }

  loadPage() {
    return new Promise(async (resolve) => {
      const response = await fetch(this.config.page);
      if (!response.ok) {
        const message = `Can't load the page: ${response.status}`;
        throw new Error(message);
      }
    
      this.htmlPage = await response.text();
      this.target.innerHTML = this.htmlPage;
      resolve();
    });
  }

  async initEdition() {
    this.bindEventsMethods();
    this.createWorkLayers();
    await this.loadPage();
    this.processData(document.querySelector('main'));
    this.getAllDataIds();
    this.saveDatabase();
  }

  keyDown(ev) {
    if (ev.keyCode === 13 && !ev.shiftKey) {
      ev.target.blur();
    }
    if (ev.keyCode === 13 && ev.shiftKey) {
      if (ev.target.write) { ev.target.write('\n'); }
    }
  }

  editImage(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    this.modalLayer.contentHTML = 'ES UNA IMAGEN';
    this.modalLayer.openModal();
  }

  editLink(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    this.modalLayer.contentHTML = 'ES UN ENLACE';
    this.modalLayer.openModal();
  }

  liBlur(ev) {
    const element = ev.target;
    if (element.innerHTML === '' && element.parentNode.tagName !== 'LI') {
      element.remove();
    }
    console.log('saving...' + element.dataset.id);
    if (this.data[element.dataset.id]) {
      this.data[element.dataset.id] = element.innerHTML;
    }
  }

  addElement(ev) {
    const elementId = ev.target.id.split('__')[0];
    console.log('addElement in ' + elementId);
    const ul = document.querySelector(`[data-id="${elementId}"]`);
    const li = document.createElement('li');
    const firstLi = ul.firstElementChild;
    const liChildren = [...firstLi.children];
    const nextId = parseInt(ul.lastElementChild.dataset.id) + 1;
    if (liChildren.length > 0) {
      li.dataset.id = nextId;
      liChildren.forEach((element) => {
        const elementB = element.cloneNode(true);
        elementB.innerHTML = element.dataset.id;
        elementB.addEventListener('blur', this.liBlur);
        elementB.addEventListener('keydown', this.keyDown);
        li.appendChild(elementB);
      });
      firstLi.parentNode.insertBefore(li, firstLi);
    } else {
      li.innerHTML = `new ${elementId}`;
      li.dataset.id = nextId;
      li.contentEditable = true;
      li.addEventListener('blur', this.liBlur);
      li.addEventListener('keydown', this.keyDown);
      ul.appendChild(li);
    }
  }

  createElementButton(element, callback, content) {
    const addElementBtn = document.createElement('button');
    addElementBtn.id = `${element.dataset.id}__Btn_${content}`;
    addElementBtn.style.width = '10%';
    addElementBtn.style.left = '90%';
    addElementBtn.style.position = 'relative';
    addElementBtn.style.fontWeight = 'bold';
    addElementBtn.style.borderRadius = '5px';
    addElementBtn.style.background = '#0F0';
    addElementBtn.innerHTML = `${content}`;
    addElementBtn.addEventListener('click', callback);
    element.parentNode.insertBefore(addElementBtn, element);
  }

  processData(element) {
    const elements = [...element.children];
    elements.forEach((element)=> {
      if (element.dataset.id || element.parentNode.tagName === 'LI') {
        if (this.editableElements.includes(element.tagName)) {
          // console.log(element.dataset.id, element.tagName);
          element.setAttribute('contenteditable', true);
          element.addEventListener('blur', this.liBlur);
          element.addEventListener('keydown', this.keyDown);
        }
        if (element.tagName === 'IMG') {
          // console.log(element.dataset.id, element.tagName);
          element.addEventListener('click', this.editImage);
        }
        if (element.tagName === 'A') {
          // console.log(element.dataset.id, element.tagName);
          element.addEventListener('click', this.editLink);
        }
        if (element.tagName === 'UL') {
          if (element.dataset.add) {
            this.createElementButton(element, this.addElement, '+');
          } 
          const liElements = [...element.children];
          liElements.forEach((li)=> {
            if ([...li.children].length === 0) {
              // console.log(li.dataset.id, 'LI');
              li.setAttribute('contenteditable', true);
              li.addEventListener('blur', this.liBlur);
              li.addEventListener('keydown', this.keyDown);
            } else {
              // console.log('process LI');
              this.processData(li);
            }
          });
        } 
      } else {
        this.processData(element);
      }
    })
  }
}