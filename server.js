const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

// set "public" directory as a static directory
app.use(express.static('public'));

// send file for '/' route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})
.get('/about', (req, res) => {
    res.sendFile(__dirname + '/public/about.html');
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});