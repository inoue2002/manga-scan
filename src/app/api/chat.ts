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

  const { fileId, points } = req.body;

  if (!fileId || !points) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze the selected region in this manga image and explain the onomatopoeia and its context.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `file-${fileId}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    return res.status(200).json({
      explanation: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to analyze image' });
  }
}