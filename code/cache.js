const helper = require('./helper')

function gradleDependencies(repoDirectory, gradleFile, botDirectory, additionalFileName) {
    return execAndCache(repoDirectory, gradleFile, botDirectory, 
        'gradleDependencies', './gradlew vapi-service:dependencies', additionalFileName)
}

function unitTestOutput(repoDirectory, gradleFile, botDirectory) {
    return execAndCache(repoDirectory, gradleFile, botDirectory, 
        'unitTestOutput', './gradlew test componentTestNoDeps', '')
}

function execAndCache(repoDirectory, gradleFile, botDirectory, name, command, additionalFileName) {
    return helper.exec(`
        cd ${repoDirectory}
        hash="$(openssl sha1 ${gradleFile} | awk '{print $NF}')"
        file="${botDirectory}/$hash.${name}.txt"
        if [ ! -f $file ]; then
            temp="./$(date '+%Y-%m-%d-%H-%M-%S').temp.txt"
            ${command} > $temp
            mv $temp $file
        fi
        if [ ! -z "${additionalFileName}" ]; then
            cat $file > "${additionalFileName}"
        fi
        cat $file
    `)
}

exports.gradleDependencies = gradleDependencies
exports.unitTestOutput = unitTestOutput
