const helper = require('./helper')
const cache = require('./cache')
const fs = require('fs/promises')

async function processLine({ lines, line, lineNumber, parts, gradleFile, repoDirectory, botDirectory }) {
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
    
    let newVersion = null

    if (/testImplementation|implementation|compile/.test(line)) {
        const newDependencies = await helper.readLines(`${botDirectory}/parts${parts}.txt`)
        const matchingLine = helper.lookForFirstOccuranceOfPackage(newDependencies, line)
        newVersion = helper.matchVersion(matchingLine, false)
    } else {
        const getDependencies = async () => (await cache
            .gradleDependencies(repoDirectory, gradleFile, botDirectory, ''))
            .split('\n')
        const oldDependencies = await getDependencies()
        lines[lineNumber] = line.replace(oldVersion, tempVersion)
        await helper.writeLines(gradleFile, lines)
        const newDependencies = await getDependencies()
        const diff = helper.lookForFirstDiff(oldDependencies, newDependencies, 3)
        if (diff != null) {
            newVersion = helper.matchVersion(diff[1], false)
        }
    }
    console.log('newVersion', newVersion)
    if (!helper.isNewVersionActuallyNewer(newVersion, oldVersion)) {
        console.error('no new version')
        return
    }
    
    lines[lineNumber] = line.replace(oldVersion, newVersion)
    helper.writeLines(gradleFile, lines)
    
    const branchName = helper.branchName(lines[lineNumber])
    const remoteBranchAlreadyExists = await helper.remoteBranchAlreadyExists(repoDirectory, branchName)
    const gitCheckoutSuccess = await helper.gitCheckout(repoDirectory, branchName)
    
    console.log('branchName', branchName)
    if (remoteBranchAlreadyExists || !gitCheckoutSuccess) {
        console.error('branch already exists')
        return
    }

    await helper.execPrint(`
        cd ${repoDirectory}
        git add ${gradleFile}
        git commit -m 'gradle-bot: ${helper.cleanUpLine(line)} -> ${helper.cleanUpLine(lines[lineNumber])}'
        git log -1
        git push github
        git reset HEAD~1
    `)
    global.gitPushCount++
    console.log('SUCCESS_NEW_VERSION_COMMITED')

    if (global.gitPushCount >= 20) {
        // Just so we don't spam the CI build
        throw 'gitPushCount' + global.gitPushCount
    }
}
    
module.exports = processLine
