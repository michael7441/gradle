const helper = require('./helper')
const testRunner = require('./testRunner')
const fs = require('fs/promises')
const processLine = require('./processLine');
const cache = require('./cache')

// console.log(fs); return;

async function start() {
    //await testRunner()

    const fdsf = "leton";
    const isLocal = await helper.fileExists("/Users/msing" + fdsf + "/repos/vapi/vapi-service/build.gradle")
    const repoDirectory = isLocal ? "/Users/msing" + fdsf + "/repos/vapi"
                                  : "/var/jenkins_home/workspace/michael-test";
    const gradleFile = repoDirectory + "/vapi-service/build.gradle"
    const botDirectory = repoDirectory + "/bot"

    await helper.execPrint(`
        cd ${repoDirectory}
        mkdir -p ${botDirectory}
        git checkout HEAD -- ${gradleFile}
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

    console.log('# Test each line with each part:')
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        let line = lines[lineNumber]
        const version = helper.matchVersion(line, true)
        if (version) {
            console.log(`
                ====================================
                ${line}     version: ${version}
            `)
            for (let parts of [ 2, 1, 0 ]) {
                await processLine(lineNumber, parts, gradleFile, repoDirectory, botDirectory)

                // command = `python3 ./bot/processLine.py ${lineNumber} ${parts} ${gradleFile}`
                // console.log(command)
                // r = helper.commandPrint(command)
                // if 'SUCCESS_NEW_VERSION_COMMITED' in r:
                // break
            }
        }
    }
}

start()
