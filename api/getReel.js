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
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Find <script type="application/ld+json"> block
    const jsonLDMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);

    if (jsonLDMatch && jsonLDMatch[1]) {
      const jsonLD = JSON.parse(jsonLDMatch[1]);
      const videoUrl = jsonLD?.video?.contentUrl;
      if (videoUrl) {
        res.status(200).json({ video_url: videoUrl });
        return;
      }
    }

    // Fallback: Try "video_url" raw search
    const rawMatch = html.match(/"video_url":"([^"]+)"/);
    if (rawMatch && rawMatch[1]) {
      const decodedUrl = rawMatch[1].replace(/\\u0026/g, '&');
      res.status(200).json({ video_url: decodedUrl });
      return;
    }

    res.status(404).json({ error: 'Could not extract video URL. The post may be private or Instagram layout changed.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
