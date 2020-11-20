class EditContent {
  constructor(config) {
    this.config = config || {};
    let errors = false;
    if (!this.config.dataJson && !this.config.getDataJson) {
      console.warn('source "dataJson" not found');
      errors = true;
    }
    if (!this.config.putDataJson) {
      console.warn('source "setDataJson" not found');
      errors = true;
    }
    if (!this.config.page) {
      console.warn('page not defined');
      errors = true;
    }
    if (!errors) {
      this.markContentEditable();
    }

    this.modalHTML = document.createElement('div');
    this.modalHTML.dataset.popupModal = 'one';
    this.modalHTML.classList.add('modal');
    this.modalHTML.classList.add('shadow');
    this.modalHTML.innerHTML = '<span class="modal-closeBtn">X</span><div id="modal-content">PRUEBA MODAL</div>';
    this.bodyBlackedout = document.createElement('div');
    this.bodyBlackedout.classList.add('blackedout');
    
    this.modalStyle = '.modal { height: 365px; width: 650px; background-color: #fff; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 45px; opacity: 0; pointer-events: none; transition: all 300ms ease-in-out; z-index: 1011; }';
    this.modalStyleVisible = '.modal-visible { opacity: 1; pointer-events: auto; }';
    this.modalStyleClose = '.modal-closeBtn { position: absolute; font-size: 1.2rem; right: -10px; top: -10px; cursor: pointer; background:#F30; padding:5px; font-size:bold; }';
    this.blackedout = '.blackedout { position: absolute; z-index: 1010; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.65); display: none; }';
    this.blackedoutVisible = '.blackedout-visible { display: block; }';
    
    const style = document.createElement('style');
    style.setAttribute('id', 'EditContentStyles');
    style.setAttribute('type', 'text/css');
    style.innerHTML = this.modalStyle + this.modalStyleVisible + this.modalStyleClose + this.blackedout + this.blackedoutVisible;
    document.getElementsByTagName('head')[0].appendChild(style);
    document.body.appendChild(this.bodyBlackedout);
    document.body.appendChild(this.modalHTML);
  }

  hideModal() {
    this.modalHTML.classList.remove('modal-visible');
    this.bodyBlackedout.classList.remove('blackedout-visible');
    document.querySelector('.blackedout').removeEventListener('click', this.hideModal);
    this.modalHTML.querySelector('.modal-closeBtn').removeEventListener('click', this.hideModal);
  }

  openModal(content) {
    this.modalHTML.classList.add('modal-visible');
    this.bodyBlackedout.classList.add('blackedout-visible');
    this.modalHTML.querySelector('#modal-content').innerHTML = content;
    this.modalHTML.querySelector('.modal-closeBtn').addEventListener('click', this.hideModal.bind(this));
    document.querySelector('.blackedout').addEventListener('click', this.hideModal.bind(this));
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

  async markContentEditable() {
    this.createWorkLayers();
    await this.loadPage();
    await this.loadJson();
    this.processData();
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

  loadJson() {
    return new Promise(async (resolve) => {
      const response = await fetch(this.config.getDataJson)
      if (!response.ok) {
        const message = `Can't load the page: ${response.status}`;
        throw new Error(message);
      }
      const database = await response.json()
      this.database = database;
      resolve();
    });
  }

  processData(database = this.database) {
    const keys = Object.keys(database);
    keys.forEach((key) => {
      this.processKey(database, key);
    });
  }

  processKey(database, key) {
    const [type, nameKey] = key.split('-');
    if (type === 'obj') {
      this.processData(database[key]);
    }
    if (type === 'arr') {
      database[key].forEach((el) => {
        this.processData(el);
      });
    }
    if (type === 'link') {
      const elementLink = document.querySelector(`[data-id=${key}]`);
      elementLink.addEventListener('click', this.setLink.bind(this));
    }
    if (type === 'img') {
      const elementImg = document.querySelector(`[data-id=${key}]`);
      elementImg.addEventListener('click', this.setImage.bind(this));
    }
    if (type === 'txt') {
      const element = document.querySelector(`[data-id=${key}]`);
      element.setAttribute('contenteditable', true);
    }
  }

  setImage(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    console.log(ev.target);
  }

  setLink(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    this.openModal(ev.target);
  }
}