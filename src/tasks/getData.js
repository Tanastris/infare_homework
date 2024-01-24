const axios = require('axios');

const scrapeData = async (url) => {
  try {
    const response = await axios.get(url);
    const jsonData = response.data;
    return jsonData;
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
};

module.exports = { scrapeData };
