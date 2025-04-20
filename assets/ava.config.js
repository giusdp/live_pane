export default {
    require: [
        'jsdom-global/register.js'
    ],
    typescript: {
        rewritePaths: { "src/": "build/" },
        compile: false
    },
    nodeArguments: ['--import=tsimp/import']
};
