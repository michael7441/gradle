const helper = require('./helper')
const fs = require('fs/promises')

async function processLine(lineNumber, parts, gradleFile, repoDirectory, botDirectory, previouslyFailedTheBuildFile) {
    
    await helper.execPrint(`
        cd ${repoDirectory}
        git checkout HEAD -- ${gradleFile}
    `)
    
    const lines = await helper.readLines(gradleFile)
    const line = lines[lineNumber]

    const oldVersion = helper.matchVersion(line, true)
    if (!oldVersion) {
        console.error('no old version')
        return
    }
    const tempVersion = helper.getTempVersion(oldVersion, parts)
    if (!tempVersion) {
        console.error('no temp version')
        return
    }
    console.log('tempVersion', tempVersion)
    
    const dependenciesFile = botDirectory + '/dependancies.txt'

    await helper.exec(`
        cd ${repoDirectory}
        if grep -q $(git rev-parse HEAD) ${dependenciesFile}; then
          echo 'dependancies hash hit'
        else
          echo 'dependancies hash miss'
          ${botDirectory}/dependancies.sh > ${dependenciesFile}
        fi
    `)
    const oldDependencies = await helper.readLines(dependenciesFile)
    
    let newVersion = null

    if (/testImplementation|implementation|compile/.test(line)) {
        const newDependencies = await helper.readLines(`${botDirectory}/parts${parts}.txt`)
        const matchingLine = helper.lookForFirstOccuranceOfPackage(newDependencies, line)
        newVersion = helper.matchVersion(matchingLine, false)
    } else {
        lines[lineNumber] = line.replace(oldVersion, tempVersion)
        await helper.writeLines(gradleFile, lines)
        const newDependencies = (await helper.exec(`
            cd ${repoDirectory}
            ${botDirectory}/dependancies.sh
        `)).split('\n')
        const diff = helper.lookForFirstDiff(oldDependencies, newDependencies, 3)
        newVersion = helper.matchVersion(diff[1], false)
    }
    console.log('newVersion', newVersion)
    if (!helper.isNewVersionActuallyNewer(newVersion, oldVersion)) {
        console.error('no new version')
        return
    }
    
    lines[lineNumber] = line.replace(oldVersion, newVersion)
    
    const previouslyFailedTheBuild = '' + await fs.readFile(previouslyFailedTheBuildFile)
    if (previouslyFailedTheBuild.includes(lines[lineNumber])) {
        console.error('previouslyFailedTheBuild')
        return
    }
    
    helper.writeLines(gradleFile, lines)
    
    const unitTestResult = await helper.exec(`
        cd ${repoDirectory}
        ./gradlew test --no-daemon | grep 'BUILD SUCCESSFUL'
    `)
    if (!unitTestResult.includes('BUILD SUCCESSFUL')) {
        await fs.appendFile(previouslyFailedTheBuildFile, '\n' + lines[lineNumber] + '\n')
        console.error('unit test not success', lines[lineNumber])
        return
    }

    await helper.exec(`
        cd ${repoDirectory}
        git add ${gradleFile}
        git commit -m 'gradle-bot: ${helper.cleanUpLine(line)} -> ${helper.cleanUpLine(lines[lineNumber])}'
    `)
    console.log('SUCCESS_NEW_VERSION_COMMITED')
}
    
module.exports = processLine
    