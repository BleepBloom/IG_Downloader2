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

    const response = await fetch(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const json = await response.json();
    const video_url =
      json?.graphql?.shortcode_media?.video_url ||
      json?.items?.[0]?.video_versions?.[0]?.url;

    if (video_url) {
      res.status(200).json({ video_url });
    } else {
      res.status(404).json({ error: 'Could not find video URL' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}