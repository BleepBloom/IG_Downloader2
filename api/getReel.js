export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    const match = url.match(/\/(p|reel)\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid Instagram URL' });
    }
    const shortcode = match[2];

    const igUrl = `https://www.instagram.com/p/${shortcode}/`;

    const response = await fetch(igUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();
    const matchVideo = html.match(/"video_url":"([^"]+)"/);

    if (matchVideo && matchVideo[1]) {
      const decodedUrl = matchVideo[1].replace(/\\u0026/g, '&');
      res.status(200).json({ video_url: decodedUrl });
    } else {
      res.status(404).json({ error: 'Could not extract video URL. The post may be private or Instagram layout changed.' });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
