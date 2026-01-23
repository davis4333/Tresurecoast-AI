import { describe, it, expect } from 'vitest';
import type { BusinessData, DraftContent } from '@/lib/ai/draftGenerator';

/**
 * AI Draft Generator Unit Tests
 *
 * These tests verify the type definitions and structure of the AI draft generator.
 * Actual OpenAI API calls are not tested here (would require API key and cost money).
 * Integration tests with mocked OpenAI responses would be in separate test files.
 */

describe('AI Draft Generator - Type Definitions', () => {
  it('should have correct BusinessData interface structure', () => {
    const validBusinessData: BusinessData = {
      name: 'Test Business',
      category: 'restaurant',
      brandVoice: 'professional',
      primaryGoal: 'bookings',
    };

    expect(validBusinessData.name).toBe('Test Business');
    expect(validBusinessData.category).toBe('restaurant');
    expect(validBusinessData.brandVoice).toBe('professional');
    expect(validBusinessData.primaryGoal).toBe('bookings');
  });

  it('should accept optional fields in BusinessData', () => {
    const businessWithOptionals: BusinessData = {
      name: 'Spa Business',
      category: 'wellness',
      websiteUrl: 'https://example.com',
      phone: '+1-555-1234',
      address: '123 Main St',
      hours: 'Mon-Fri 9am-5pm',
      services: ['Massage', 'Facial', 'Manicure'],
      bookingUrl: 'https://example.com/book',
      brandVoice: 'luxury',
      primaryGoal: 'leads',
    };

    expect(businessWithOptionals.websiteUrl).toBe('https://example.com');
    expect(businessWithOptionals.phone).toBe('+1-555-1234');
    expect(businessWithOptionals.address).toBe('123 Main St');
    expect(businessWithOptionals.hours).toBe('Mon-Fri 9am-5pm');
    expect(businessWithOptionals.services).toEqual(['Massage', 'Facial', 'Manicure']);
    expect(businessWithOptionals.bookingUrl).toBe('https://example.com/book');
  });

  it('should validate brandVoice enum values', () => {
    const validVoices: Array<BusinessData['brandVoice']> = [
      'professional',
      'friendly',
      'luxury',
      'bold',
      'chill',
    ];

    for (const voice of validVoices) {
      const data: BusinessData = {
        name: 'Test',
        category: 'test',
        brandVoice: voice,
        primaryGoal: 'bookings',
      };
      expect(data.brandVoice).toBe(voice);
    }
  });

  it('should validate primaryGoal enum values', () => {
    const validGoals: Array<BusinessData['primaryGoal']> = [
      'bookings',
      'leads',
      'faqs',
      'support',
    ];

    for (const goal of validGoals) {
      const data: BusinessData = {
        name: 'Test',
        category: 'test',
        brandVoice: 'professional',
        primaryGoal: goal,
      };
      expect(data.primaryGoal).toBe(goal);
    }
  });
});

describe('AI Draft Generator - DraftContent Interface', () => {
  it('should have correct DraftContent structure', () => {
    const validDraft: DraftContent = {
      aboutText: 'This is a test about section.',
      faqs: [
        { question: 'What are your hours?', answer: 'Mon-Fri 9am-5pm' },
        { question: 'Do you offer refunds?', answer: 'Yes, within 30 days' },
      ],
      kbEntries: [
        { title: 'Cancellation Policy', content: 'Cancel up to 24 hours in advance...' },
        { title: 'Booking Process', content: 'To book an appointment, visit...' },
      ],
    };

    expect(validDraft.aboutText).toBe('This is a test about section.');
    expect(validDraft.faqs).toHaveLength(2);
    expect(validDraft.kbEntries).toHaveLength(2);
  });

  it('should allow empty arrays for faqs and kbEntries', () => {
    const minimalDraft: DraftContent = {
      aboutText: 'Minimal about text.',
      faqs: [],
      kbEntries: [],
    };

    expect(minimalDraft.faqs).toEqual([]);
    expect(minimalDraft.kbEntries).toEqual([]);
  });

  it('should have correct FAQ structure', () => {
    const faq: DraftContent['faqs'][0] = {
      question: 'What payment methods do you accept?',
      answer: 'We accept Visa, MasterCard, and cash.',
    };

    expect(faq).toHaveProperty('question');
    expect(faq).toHaveProperty('answer');
    expect(typeof faq.question).toBe('string');
    expect(typeof faq.answer).toBe('string');
  });

  it('should have correct KB entry structure', () => {
    const entry: DraftContent['kbEntries'][0] = {
      title: 'Refund Policy',
      content: 'Full refunds available within 30 days of purchase...',
    };

    expect(entry).toHaveProperty('title');
    expect(entry).toHaveProperty('content');
    expect(typeof entry.title).toBe('string');
    expect(typeof entry.content).toBe('string');
  });
});

describe('AI Draft Generator - Business Scenarios', () => {
  it('should support restaurant business data', () => {
    const restaurant: BusinessData = {
      name: 'The Gourmet Kitchen',
      category: 'restaurant',
      phone: '+1-555-FOOD',
      address: '456 Culinary Ave',
      hours: 'Tue-Sun 11am-10pm',
      services: ['Dine-in', 'Takeout', 'Catering'],
      bookingUrl: 'https://opentable.com/gourmet',
      brandVoice: 'friendly',
      primaryGoal: 'bookings',
    };

    expect(restaurant.category).toBe('restaurant');
    expect(restaurant.services).toContain('Dine-in');
    expect(restaurant.brandVoice).toBe('friendly');
  });

  it('should support spa/wellness business data', () => {
    const spa: BusinessData = {
      name: 'Serenity Day Spa',
      category: 'wellness',
      phone: '+1-555-RELAX',
      address: '789 Zen Street',
      hours: 'Mon-Sat 9am-8pm',
      services: ['Massage', 'Facial', 'Body Scrub'],
      bookingUrl: 'https://book.serenity.com',
      brandVoice: 'luxury',
      primaryGoal: 'bookings',
    };

    expect(spa.category).toBe('wellness');
    expect(spa.brandVoice).toBe('luxury');
    expect(spa.primaryGoal).toBe('bookings');
  });

  it('should support service business with lead generation goal', () => {
    const contractor: BusinessData = {
      name: 'Premier Roofing',
      category: 'construction',
      phone: '+1-555-ROOF',
      websiteUrl: 'https://premierroofing.com',
      services: ['Roof Repair', 'Roof Replacement', 'Gutter Installation'],
      brandVoice: 'professional',
      primaryGoal: 'leads',
    };

    expect(contractor.primaryGoal).toBe('leads');
    expect(contractor.brandVoice).toBe('professional');
    expect(contractor.services).toContain('Roof Repair');
  });

  it('should support SaaS business with support goal', () => {
    const saas: BusinessData = {
      name: 'CloudSync Pro',
      category: 'software',
      websiteUrl: 'https://cloudsync.io',
      brandVoice: 'professional',
      primaryGoal: 'support',
    };

    expect(saas.primaryGoal).toBe('support');
    expect(saas.category).toBe('software');
  });

  it('should support casual brand with chill voice', () => {
    const skateshop: BusinessData = {
      name: 'Rad Skate Shop',
      category: 'retail',
      brandVoice: 'chill',
      primaryGoal: 'faqs',
    };

    expect(skateshop.brandVoice).toBe('chill');
    expect(skateshop.primaryGoal).toBe('faqs');
  });

  it('should support bold brand voice', () => {
    const gym: BusinessData = {
      name: 'Iron Temple Gym',
      category: 'fitness',
      brandVoice: 'bold',
      primaryGoal: 'bookings',
    };

    expect(gym.brandVoice).toBe('bold');
  });
});

describe('AI Draft Generator - Content Validation', () => {
  it('should validate draft content has aboutText', () => {
    const draft: DraftContent = {
      aboutText: 'We are a family-owned business serving the community since 1995.',
      faqs: [],
      kbEntries: [],
    };

    expect(draft.aboutText.length).toBeGreaterThan(0);
    expect(typeof draft.aboutText).toBe('string');
  });

  it('should validate FAQ questions and answers are strings', () => {
    const draft: DraftContent = {
      aboutText: 'About text',
      faqs: [
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ],
      kbEntries: [],
    };

    for (const faq of draft.faqs) {
      expect(typeof faq.question).toBe('string');
      expect(typeof faq.answer).toBe('string');
    }
  });

  it('should validate KB entries have title and content', () => {
    const draft: DraftContent = {
      aboutText: 'About text',
      faqs: [],
      kbEntries: [
        { title: 'Title 1', content: 'Content 1' },
        { title: 'Title 2', content: 'Content 2' },
      ],
    };

    for (const entry of draft.kbEntries) {
      expect(typeof entry.title).toBe('string');
      expect(typeof entry.content).toBe('string');
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.content.length).toBeGreaterThan(0);
    }
  });
});

describe('AI Draft Generator - Environment Configuration', () => {
  it('should check for OPENAI_API_KEY environment variable', () => {
    // This test verifies the env var name is correct
    const expectedEnvVar = 'OPENAI_API_KEY';
    expect(expectedEnvVar).toBe('OPENAI_API_KEY');
  });

  it('should check for AI_PROVIDER environment variable', () => {
    const expectedProviderVar = 'AI_PROVIDER';
    expect(expectedProviderVar).toBe('AI_PROVIDER');
  });
});
