const helper = require('./helper')

function gradleDependencies(repoDirectory, gradleFile, botDirectory, additionalFileName) {
    return execAndCache(repoDirectory, gradleFile, botDirectory, 
        'gradleDependencies', './gradlew vapi-service:dependencies --no-daemon', additionalFileName)
}

function unitTestOutput(repoDirectory, gradleFile, botDirectory) {
    return execAndCache(repoDirectory, gradleFile, botDirectory, 
        'unitTestOutput', './gradlew test --no-daemon', '')
}

function execAndCache(repoDirectory, gradleFile, botDirectory, name, command, additionalFileName) {
    return helper.exec(`
        cd ${repoDirectory}
        hash="$(openssl sha1 ${gradleFile} | awk '{print $NF}')"
        file="${botDirectory}/$hash.${name}.txt"
        if [ ! -f $file ]; then
            ${command} > $file.temp
            mv $file.temp $file
        fi
        if [ ! -z "${additionalFileName}" ]; then
            cat $file > "${additionalFileName}"
        fi
        cat $file
    `)
}

exports.gradleDependencies = gradleDependencies
exports.unitTestOutput = unitTestOutput
