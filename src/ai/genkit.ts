import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const google = googleAI();

export const ai = genkit({
  plugins: [google as Plugin<any>],
  model: 'googleai/gemini-2.5-flash',
});
