const express = require("express");
const axios = require("axios");
const { JSDOM } = require("jsdom");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("Movie Fetcher API is LIVE 🚀");
});

app.get("/movies/:name", async (req, res) => {
  const movieName = req.params.name;
  try {
    const url = `${process.env.BASE_URL}/s/${encodeURIComponent(movieName)}`;
    const response = await axios.get(url);
    const htmlCode = response.data;
	console.log(htmlCode)
    const dom = new JSDOM(htmlCode);
    const document = dom.window.document;

    const movieLinks = document.querySelectorAll(".directory-entry");
    const movies = Array.from(movieLinks).map((movieLink) => ({
      name: movieLink.textContent.trim(),
      url: movieLink.getAttribute("href"),
    }));

    res.json(movies);
  } catch (error) {
    console.error("Error fetching movies:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

app.get("/movie/:url", async (req, res) => {
  const movieUrl = req.params.url;
  try {
    const url = `${process.env.BASE_URL}${movieUrl}`;
    const response = await axios.get(url);
    const htmlCode = response.data;

    const dom = new JSDOM(htmlCode);
    const document = dom.window.document;

    const fileLinks = document.querySelectorAll(".file-entry");
    const files = Array.from(fileLinks).map((fileLink) => ({
      name: fileLink.textContent.trim(),
      url: fileLink.getAttribute("href"),
    }));

    const seasonLinks = document.querySelectorAll(".directory-entry");
    const seasons = Array.from(seasonLinks).map((seasonLink) => ({
      name: seasonLink.textContent.trim(),
      url: seasonLink.getAttribute("href"),
    }));

    res.json({ files, seasons });
  } catch (error) {
    console.error("Error fetching movie details:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

app.listen(PORT, () => {
  console.log(`Movie Fetcher API is running on port ${PORT}`);
});

module.exports = app;
