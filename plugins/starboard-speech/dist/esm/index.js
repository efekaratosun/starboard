import { registerPlugin } from '@capacitor/core';
const StarboardSpeech = registerPlugin('StarboardSpeech', {
    web: () => import('./web').then((m) => new m.StarboardSpeechWeb()),
});
export * from './definitions';
export { StarboardSpeech };
//# sourceMappingURL=index.js.map