import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface BusinessData {
  name: string;
  category: string;
  websiteUrl?: string;
  phone?: string;
  address?: string;
  hours?: string;
  services?: string[];
  bookingUrl?: string;
  brandVoice: 'professional' | 'friendly' | 'luxury' | 'bold' | 'chill';
  primaryGoal: 'bookings' | 'leads' | 'faqs' | 'support';
}

export interface DraftContent {
  aboutText: string;
  faqs: Array<{ question: string; answer: string }>;
  kbEntries: Array<{ title: string; content: string }>;
}

export async function generateDrafts(
  business: BusinessData
): Promise<DraftContent> {
  const prompt = buildPrompt(business);
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert copywriter for AI chatbot knowledge bases. Generate high-quality, accurate content for a ${business.category} business. Match the brand voice: ${business.brandVoice}. Focus on the goal: ${business.primaryGoal}.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI');
  }

  const parsed = JSON.parse(response);
  return {
    aboutText: parsed.aboutText || '',
    faqs: parsed.faqs || [],
    kbEntries: parsed.kbEntries || [],
  };
}

function buildPrompt(business: BusinessData): string {
  return `
Generate knowledge base content for the following business:

Business Name: ${business.name}
Category: ${business.category}
${business.websiteUrl ? `Website: ${business.websiteUrl}` : ''}
${business.phone ? `Phone: ${business.phone}` : ''}
${business.address ? `Address: ${business.address}` : ''}
${business.hours ? `Hours: ${business.hours}` : ''}
${business.services && business.services.length > 0 ? `Services: ${business.services.join(', ')}` : ''}
${business.bookingUrl ? `Booking URL: ${business.bookingUrl}` : ''}

Brand Voice: ${business.brandVoice}
Primary Goal: ${business.primaryGoal}

Generate the following in JSON format:
{
  "aboutText": "A 2-3 paragraph 'About Us' section that introduces the business, its values, and what makes it special. Match the brand voice.",
  "faqs": [
    { "question": "...", "answer": "..." },
    // 5-10 common questions customers ask
  ],
  "kbEntries": [
    { "title": "...", "content": "..." },
    // 3-5 knowledge base articles covering key topics
  ]
}

Rules:
- Use ONLY the provided business data. Do not invent prices, services, or policies.
- If a detail is missing, be general or prompt the user to provide it.
- Match the brand voice in tone and language.
- Focus on the primary goal (bookings, leads, FAQs, or support).
- Keep answers concise and helpful.
- For a luxury brand, use elegant language. For a chill brand, use casual tone.

Return ONLY the JSON object, no additional text.
`;
}

export async function testAIConnection(): Promise<boolean> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: 'Respond with "OK"' }],
      max_tokens: 10,
    });
    return completion.choices[0]?.message?.content === 'OK';
  } catch (error) {
    console.error('[AI] Connection test failed:', error);
    return false;
  }
}
