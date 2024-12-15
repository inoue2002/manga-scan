import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const file = req.body;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const uploadedFile = await openai.files.create({
      file,
      purpose: 'assistants',
    });

    return res.status(200).json({
      id: uploadedFile.id,
      name: uploadedFile.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
}