const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// API Endpoint: Pencarian & Rekomendasi
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || 'terbaru'; // Default query untuk rekomendasi Home
    const searchUrl = `https://movieku.fit/?s=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    const results = [];

    $('.los article.box').each((i, el) => {
      const link = $(el).find('a.tip');
      const title = link.attr('title') || link.find('h2.entry-title').text();
      const url = link.attr('href');
      const img = $(el).find('img').attr('src');
      const quality = $(el).find('.quality').text();
      const year = title.match(/\((\d{4})\)/)?.[1] || '';

      if (title && url) {
        results.push({ title, url, image: img, quality, year, type: 'Movie' });
      }
    });

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Endpoint: Detail Film & Link Download
app.get('/api/detail', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ success: false, message: 'URL dibutuhkan' });

    const response = await axios.get(targetUrl, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    
    const detail = {
      synopsis: $('.synops .entry-content p').first().text().trim(),
      genres: [],
      release: '',
      duration: '',
      country: '',
      rating: '',
      downloads: []
    };

    $('.data li').each((i, el) => {
      const text = $(el).text();
      if (text.includes('Genre:')) {
        $(el).find('a').each((j, a) => detail.genres.push($(a).text()));
      } else if (text.includes('Release:')) {
        detail.release = text.replace('Release:', '').trim();
      } else if (text.includes('Duration:')) {
        detail.duration = text.replace('Duration:', '').trim();
      } else if (text.includes('Rating:')) {
        detail.rating = text.replace('Rating:', '').trim();
      }
    });

    $('#smokeddl .smokeurl p').each((i, el) => {
      const quality = $(el).find('strong').text().replace(':', '').trim();
      const links = [];
      $(el).find('a').each((j, a) => {
        links.push({ provider: $(a).text().trim(), url: $(a).attr('href') });
      });
      if (quality) detail.downloads.push({ quality, links });
    });

    res.json({ success: true, data: detail });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = app;
