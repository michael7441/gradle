const util = require('node:util');
const _exec = util.promisify(require('node:child_process').exec);
const fs = require('fs/promises')


async function exec(s) {
  const { stdout, stderr } = await _exec(s);
  stderr && console.error('stderr:', stderr);
  return stdout
}

async function execPrint(s) {
    const result = await exec(s)
    global.testsPassed && console.log(result)
    return result
}

function matchLastOccurance(regex, s) {
    if (!s) return null
    const matches = s.match(regex)
    return matches ? matches[matches.length - 1] : null
}

function matchFirstOccurance(regex, s) {
    if (!s) return null
    const matches = s.match(regex)
    return matches ? matches[0] : null
}

const matchVersion = (() => {
    const expectedWords = /Version|testImplementation|implementation|compile/
    const excludedWords = /nexmoinc|info.solidsoft.pitest|org.ajoberstar.grgit|classpath |id |pitestVersion|rtcVersion/
    const versionRegex = /\b(\d+\.)+[^\s"':]+/g

    return function matchVersion(s, guard) {
        if (guard) {
            if (!expectedWords.test(s)) return null
            if (excludedWords.test(s)) return null
        }
        return matchLastOccurance(versionRegex, s)
    }
})()

const getTempVersion = (() => {
    const patern = '[^.]+\\.'
    const regex1 = new RegExp(patern)
    const regex2 = new RegExp(patern + patern)

    return function getTempVersion(oldVersion, parts) {
        let tempVersion = null
        if (parts === 0) tempVersion = ''
        if (parts === 1) tempVersion = matchFirstOccurance(regex1, oldVersion)
        if (parts === 2) tempVersion = matchFirstOccurance(regex2, oldVersion)
        if (tempVersion != null) tempVersion += '+'
        return tempVersion
    }
})()

function lookForFirstDiff(leftArray, rightArray, startIndex) {
    const length = Math.min(leftArray?.length || 0, rightArray?.length || 0)
    for (let i = startIndex; i < length; i++) {
        if (leftArray[i] != rightArray[i]) {
            return [leftArray[i], rightArray[i]]
        }
    }
    return null
}

function lookForFirstOccuranceOfPackage(dependenciesArray, lineContainingPackageName) {
    const packageNameRegex = /[^"':]+:[^"':]+/
    const packageName = matchFirstOccurance(packageNameRegex, lineContainingPackageName) + ':'
    return dependenciesArray.find(x => x.includes(packageName)) || null
}

function fail(reason) {
    console.error('FAIL: ' + reason)
    process.exit(2);
}


function isNewVersionActuallyNewer(newVersion, oldVersion) {
    if (!newVersion) return false
    if (!oldVersion) return true
    if (newVersion === oldVersion) return false

    for (let i = 0; i < 5; i++) {
        const newInt = getIntAtPostion(newVersion, i)
        const oldInt = getIntAtPostion(oldVersion, i)
        if (newInt === null || oldInt === null) break
        if (newInt > oldInt) return true
        if (newInt < oldInt) return false
    }
    return true
}
    
function getIntAtPostion(version, i) {
    const string = version.split('.')[i]
    const int = +string
    return int.toString() === string ? int : null
}

function cleanUpLine(line) {
    return line.replace(/['"]/g, '').trim()
}

function branchName(line) {
    const clean = line.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
    return 'δ-gradle-dependancy-update-bot/' + clean
}

async function remoteBranchAlreadyExists(repoDirectory, branchName) {
    try {
        // If the branch exists in github then this command will succeed
        await execPrint(`
            cd ${repoDirectory}
            git show-ref github '${branchName}'
        `)
        return true
    } catch (err) {
        // An exception was through because the branch could not be found
        return false
    }
}

function fileExists(path) {
    return fs.stat(path).then(() => true).catch(() => false);
}

async function readLines(path) {
    return ('' + await fs.readFile(path)).split('\n')
}
function writeLines(path, linesArray) {
    return fs.writeFile(path, linesArray.join('\n'))
}



exports.exec = exec
exports.execPrint = execPrint
exports.matchLastOccurance = matchLastOccurance
exports.matchFirstOccurance = matchFirstOccurance
exports.matchVersion = matchVersion
exports.getTempVersion = getTempVersion
exports.lookForFirstDiff = lookForFirstDiff
exports.lookForFirstOccuranceOfPackage = lookForFirstOccuranceOfPackage
exports.isNewVersionActuallyNewer = isNewVersionActuallyNewer
exports.cleanUpLine = cleanUpLine
exports.branchName = branchName
exports.remoteBranchAlreadyExists = remoteBranchAlreadyExists
exports.fail = fail
exports.fileExists = fileExists
exports.readLines = readLines
exports.writeLines = writeLines
