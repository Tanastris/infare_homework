const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const scrapeData = require('./tasks/getData');
const app = express();

const PORT = 3000;

app.get('/', function (req, res) {
  res.send('Hello World');
});

app.get('/', async (req, res) => {
  try {
    const url = 'http://homeworktask.infare.lt/';
    const jsonData = await scraper.scrapeData(url);
    res.json(jsonData);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  `Server running on http://localhost:${PORT}`;
});
