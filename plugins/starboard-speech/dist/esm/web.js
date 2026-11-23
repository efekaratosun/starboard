import { WebPlugin } from '@capacitor/core';
export class StarboardSpeechWeb extends WebPlugin {
    async status() {
        return { supported: false, permission: 'denied' };
    }
    async start() {
        throw this.unavailable('Speech recognition is only available on iOS.');
    }
    async stop() {
        throw this.unavailable('Speech recognition is only available on iOS.');
    }
    async cancel() {
        return;
    }
}
//# sourceMappingURL=web.js.map