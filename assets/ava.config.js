export default {
    typescript: {
        rewritePaths: {
            "src/": "build/"
        },
        compile: false
    },
    nodeArguments: ['--import=tsimp/import']
}