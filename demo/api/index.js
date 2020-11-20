const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const currentPath = process.cwd();
const databaseFile = 'database.json';
const pathDatabase = path.join(currentPath, 'demo', 'api', databaseFile);

const database = JSON.parse(fs.readFileSync(pathDatabase, 'utf-8'));

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

let respuesta = {
  error: false,
  codigo: 200,
  mensaje: ''
};

function processField(field) {
  const parts = field.split('.');
  const arrFields = parts.map((el) => `['${el}']`);
  const strFields = arrFields.join('');

  let value;
  eval(`try { value = database${strFields} } catch(e) { }`);
  return [strFields, value];
}

app.get('/', function(req, res) {
  respuesta = {
    error: true,
    codigo: 200,
    mensaje: 'Options /data by get and post'
  };
  console.log('get /');
  res.send(respuesta);
});

app.route('/data')
  .get(function(req, res) {
    const field = req.query.field;
    if (field) {
      const [strFields, value] = processField(field);

      if (value) {
        respuesta = value;
        console.log(`get /data database${strFields} = ${value}`);
      } else {
        respuesta = {
          error: true,
          codigo: 200,
          mensaje: `${field} not found in database`
        };
        console.log(`get /data ${field} not found in database`);
      }
    } else {
      respuesta = database;
      console.log('get /data database');
    }
    res.send(respuesta);
  })
  .put(function(req, res) {
    const field = req.body.field;
    const newValue = req.body.value;
    const [strFields, oldValue] = processField(field);
    if (!field || !newValue) {
      respuesta = {
        error: true,
        codigo: 502,
        mensaje: 'El campo field y value son requeridos'
      };
    } else {
      eval(`database${strFields} = "${newValue}"`);
      fs.writeFileSync(pathDatabase, JSON.stringify(database));
      respuesta = {
        error: false,
        codigo: 200,
        mensaje: `put /data database${strFields} = ${newValue}`
      };
    }
    console.log(`put /data database${strFields} = ${newValue}`);
    res.send(respuesta);
  });

app.use(function(req, res, next) {
  respuesta = {
    error: true,
    codigo: 404,
    mensaje: 'URL no encontrada'
  };
  console.log('404 not found');
  res.status(404).send(respuesta);
});

app.listen(3000, () => {
  console.log('El servidor está inicializado en el puerto 3000');
});
