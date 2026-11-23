'use strict';

var core = require('@capacitor/core');

class StarboardSpeechWeb extends core.WebPlugin {
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

const StarboardSpeech = core.registerPlugin('StarboardSpeech', {
    web: () => Promise.resolve(new StarboardSpeechWeb()),
});

module.exports = StarboardSpeech;