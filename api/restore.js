// /api/restore.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { feature, options, image } = req.body;

  if (!image || !feature) {
    return res.status(400).json({ error: 'Missing image or feature' });
  }

  try {
    // Contoh payload request ke Replicate API
    // Sesuaikan model dan input sesuai fitur yang dipilih
    const modelVersion = 'your-model-version-here'; // Ganti dengan versi model yang kamu gunakan di Replicate

    const replicateResponse = await fetch(`https://api.replicate.com/v1/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          image: image,
          feature: feature,
          options: options || {},
        },
      }),
    });

    if (!replicateResponse.ok) {
      const errText = await replicateResponse.text();
      return res.status(500).json({ error: `Replicate API error: ${errText}` });
    }

    const prediction = await replicateResponse.json();

    // Kirim ID prediksi supaya client bisa polling status
    res.status(200).json({ predictionId: prediction.id });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
