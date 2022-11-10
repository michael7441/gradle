const helper = require('./helper')
const testRunner = require('./testRunner')
const fs = require('fs/promises')
const processLine = require('./processLine');
const cache = require('./cache')

// console.log(fs); return;

async function start() {
    console.time('build timer')
    //await testRunner()
    global.testsPassed = true
    global.gitPushCount = 0

    const fdsf = "leton";
    const isLocal = await helper.fileExists("/Users/msing" + fdsf + "/repos/vapi/vapi-service/build.gradle")
    const repoDirectory = isLocal ? "/Users/msing" + fdsf + "/repos/vapi"
                                  : "/var/jenkins_home/workspace/michael-test";
    const gradleFile = repoDirectory + "/vapi-service/build.gradle"
    const botDirectory = repoDirectory + "/bot"

    await helper.execPrint(`
        cd ${repoDirectory}
        mkdir -p ${botDirectory}
        chmod +x ${botDirectory}
        git checkout HEAD -- ${gradleFile}
        git fetch --prune github
    `)

    const lines = await helper.readLines(gradleFile)
    console.log('lines.length', lines.length)

    for (let parts of [ 2, 1, 0 ]) {
        console.log(`# Cache gradleDependancies: ${parts} parts`)

        let linesCopy = [...lines]
            .map(line => {
                const oldVersion = /testImplementation|implementation|compile/.test(line) && helper.matchVersion(line, true)
                const tempVersion = helper.getTempVersion(oldVersion, parts)
                if (oldVersion && tempVersion) {
                    // console.log(line + '     ' + oldVersion + '   ' + tempVersion)
                    return line.replace(oldVersion, tempVersion)
                }
                return line
            })
        await helper.writeLines(gradleFile, linesCopy)
        await cache.gradleDependencies(repoDirectory, gradleFile, botDirectory,
            `${botDirectory}/parts${parts}.txt`)
    }
    

    let count = 0

    console.timeLog('build timer')
    console.log('# Test each line with each part:')
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        let line = lines[lineNumber]
        const version = /testImplementation|implementation|compile/.test(line) && helper.matchVersion(line, true)
        if (version) {
            console.timeLog('build timer')
            console.log(`
                ====================================
                ${line}     version: ${version}
            `)
            for (let parts of [ 2, 1, 0 ]) {
                count++
                console.log('count', count)
                if (count !== 1) console.log(`
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
                `)
                await processLine({ lines: [...lines], line, lineNumber, parts, gradleFile, repoDirectory, botDirectory })
                count--
            }
        }
    }
    console.timeLog('build timer')
}

start()
