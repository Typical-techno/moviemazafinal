const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

let isSearching = false;

// Event listener for the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const responseMessage = `
    👋 Hello there!
    
    Welcome to Movie Maza 🎬, your personal movie assistant!
    
    To get started, simply type /search to find your favorite movies.
    
    Enjoy your movie journey with Movie Maza! 🍿🎉
  `;
  bot.sendMessage(chatId, responseMessage);
  // Set the searching flag to false when /start command is used
  isSearching = false;
});

// Event listener for the /search command
bot.onText(/\/search/, (msg) => {
  const chatId = msg.chat.id;
  const responseMessage = `
    🔍 Search Movies
    
    Looking for a movie? Just type the name of the movie you want to search and I'll find it for you!
    
    Let's find some awesome movies together! 🎥✨
  `;
  bot.sendMessage(chatId, responseMessage);
  // Set the searching flag to true when /search command is used
  isSearching = true;
});

// Event listener for incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const movieName = msg.text.trim();

  try {
    if (!isSearching) {
      // If not searching, ignore the message
      return;
    }

    // Make a GET request to the movie fetching API
    const movieAPIUrl = `${process.env.MOVIE_FETCH_API_URL}/movies/${encodeURIComponent(movieName)}`;
    const response = await axios.get(movieAPIUrl);
    const movies = response.data;

    if (movies.length === 0) {
      // If no movies found, send a sorry message
      const sorryMessage = `
        Sorry, I couldn't find any movies or series with the name "${movieName}" 😔🎬
        
        Feel free to try searching for another movie!
      `;
      bot.sendMessage(chatId, sorryMessage);
    } else {
      // Send each movie/series as a separate message with a button
      movies.forEach((movie, index) => {
        const buttonText = `This is My Movie/Series`;
        const message = `🎬 ${index + 1}. *${movie.name}*`;
        const keyboard = {
          inline_keyboard: [[{ text: buttonText, callback_data: movie.url }]],
        };
        bot.sendMessage(chatId, message, {
          parse_mode: "Markdown",
          reply_markup: JSON.stringify(keyboard),
        });
      });
    }
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
    bot.sendMessage(chatId, "Error searching for movies. Please try again later.");
  }
});

// Event listener for callback queries
bot.on("callback_query", async (callbackQuery) => {
  const movieUrl = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  try {
    const beforeMsg = "------------------------\n\nYou can Download the Movie/Series From here....\nor you can just watch it online by copying the link and network stream with VLC media player or any other player that supports network stream\n\n------------------------";
    bot.sendMessage(chatId, beforeMsg);
    const movieAPIUrl = `${process.env.MOVIE_FETCH_API_URL}/movie/${encodeURIComponent(movieUrl)}`;
    const response = await axios.get(movieAPIUrl);
    const movieData = response.data;

    if (movieData.seasons && movieData.seasons.length > 0) {
      // It's a series, so list the seasons
      movieData.seasons.forEach((season, index) => {
        const seasonName = season.name.trim();
        // Exclude items with the name "Parent Directory"
        if (seasonName !== "Parent Directory") {
          const buttonText = `Select Season`;
          const message = `${index + 1}. ${seasonName}`;
          const keyboard = {
            inline_keyboard: [
              [{ text: buttonText, callback_data: season.url }],
            ],
          };
          bot.sendMessage(chatId, message, {
            reply_markup: JSON.stringify(keyboard),
          });
        }
      });
    } else if (movieData.files && movieData.files.length > 0) {
      // It's a movie, so list the files
      movieData.files.forEach((file, index) => {
        const fileName = file.name.trim();
        // Include items that contain 'mp4' or 'mkv' in the file name
        if (fileName.includes('mp4') || fileName.includes('mkv')) {
          const downloadUrl = `${process.env.BASE_URL}${file.url}`;
          const watchOnlineUrl = `https://a751-103-167-205-137.ngrok-free.app/Movie/movie.html?source=${encodeURIComponent(downloadUrl)}&title=${encodeURIComponent(fileName)}`;

          const message = `${fileName}\n`;
          const keyboard = {
            inline_keyboard: [ 
              [
                { text: 'Download', url: downloadUrl },
                { text: 'Watch Online', url: watchOnlineUrl }
              ],
            ],
          };
          bot.sendMessage(chatId, message, {
            reply_markup: JSON.stringify(keyboard),
          });
        }
      });
    }
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
});

// Event listener for season callback queries
bot.on("callback_query", async (callbackQuery) => {
  const seasonUrl = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  try {
    // Make a GET request to the season URL
    const seasonAPIUrl = `${process.env.MOVIE_FETCH_API_URL}/movie/${encodeURIComponent(seasonUrl)}`;
    const response = await axios.get(seasonAPIUrl);
    const seasonData = response.data;

    // List the files in the season
    if (seasonData.files && seasonData.files.length > 0) {
      seasonData.files.forEach((file, index) => {
        const fileName = file.name.trim();
        // Include items that contain 'mp4' or 'mkv' in the file name
        if (fileName.includes('mp4') || fileName.includes('mkv')) {
          const downloadUrl = `${process.env.BASE_URL}${file.url}`;
          const watchOnlineUrl = `https://a751-103-167-205-137.ngrok-free.app/Movie/movie.html?source=${encodeURIComponent(downloadUrl)}&title=${encodeURIComponent(fileName)}`;

          const message = `${fileName}\n`;
          const keyboard = {
            inline_keyboard: [ 
              [
                { text: 'Download', url: downloadUrl },
                { text: 'Watch Online', url: watchOnlineUrl }
              ],
            ],
          };
          bot.sendMessage(chatId, message, {
            reply_markup: JSON.stringify(keyboard),
          });
        }
      });
    }
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
});

module.exports = bot;
