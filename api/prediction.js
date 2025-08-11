// /api/prediction.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { predictionId } = req.body;

  if (!predictionId) {
    return res.status(400).json({ error: 'Missing predictionId' });
  }

  try {
    const replicateResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
    });

    if (!replicateResponse.ok) {
      const errText = await replicateResponse.text();
      return res.status(500).json({ error: `Replicate API error: ${errText}` });
    }

    const prediction = await replicateResponse.json();

    // Return status dan output url jika sudah selesai
    res.status(200).json({
      status: prediction.status,
      output: prediction.output ? prediction.output[0] : null,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
