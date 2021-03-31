const express = require('express')
const path = require('path')
const port = process.env.PORT || 8080
require('dotenv').config({ path: path.join(__dirname, '.env') })
const app = express()
console.log(process.env)
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build')));
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.listen(port);