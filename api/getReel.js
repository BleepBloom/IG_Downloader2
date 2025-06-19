export default async function handler(req, res) {
  let { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    // Normalize: remove query params, trailing slash
    url = url.split('?')[0].replace(/\/$/, '');

    // Extract shortcode robustly: works for /reel/, /p/, /tv/
    const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    if (!match || !match[1]) {
      return res.status(400).json({ error: 'Could not extract shortcode from URL. Please check.' });
    }

    const shortcode = match[1];
    const igUrl = `https://www.instagram.com/p/${shortcode}/`;

    // Fetch with browser-like headers
    const response = await fetch(igUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Try JSON-LD first
    const jsonLDMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    if (jsonLDMatch && jsonLDMatch[1]) {
      const jsonLD = JSON.parse(jsonLDMatch[1]);
      const videoUrl = jsonLD?.video?.contentUrl;
      if (videoUrl) {
        return res.status(200).json({ video_url: videoUrl });
      }
    }

    // Fallback: raw "video_url"
    const rawMatch = html.match(/"video_url":"([^"]+)"/);
    if (rawMatch && rawMatch[1]) {
      const decoded = rawMatch[1].replace(/\\u0026/g, '&');
      return res.status(200).json({ video_url: decoded });
    }

    return res.status(404).json({
      error: 'Could not extract video URL. Post may be private or Instagram layout changed.'
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
