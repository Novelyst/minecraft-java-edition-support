
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('vortex-api/bin/webpack').default;

module.exports = webpack('game-minecraft-java', __dirname, 5);

