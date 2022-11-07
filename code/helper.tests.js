const helper = require('./helper')

const tests = [
    async () => {
        const target = 'exec'
        const pwd = await helper[target]('pwd')
        if (!pwd.includes('/code')) {
            return target + ': pwd did not return gradle_dependancy_update_bot/code'
        }
    },
    async () => {
        const target = 'execPrint'
        const pwd = await helper[target]('pwd')
        if (!pwd.includes('/code')) {
            return target + ': pwd did not return gradle_dependancy_update_bot/code'
        }
    },
    async () => {
        const target = 'matchLastOccurance'
        const result = helper[target](/\d+/g, '11 22 33')
        if (result !== '33') {
            return `${target}: did not match, ${result}`
        }
    },
    async () => {
        const target = 'matchLastOccurance'
        const result = helper[target](/aaa/g, '11 22 33')
        if (result !== null) {
            return `${target}: A failed match should be null, ${result}`
        }
    },
    async () => {
        const target = 'matchFirstOccurance'
        const result = helper[target](/\d+/g, '11 22 33')
        if (result !== '11') {
            return `${target}: did not match, ${result}`
        }
    },
    async () => {
        const target = 'matchFirstOccurance'
        const result = helper[target](/aaa/g, '11 22 33')
        if (result !== null) {
            return `${target}: A failed match should be null, ${result}`
        }
    },
    async () => {
        const target = 'matchVersion'
        const result = helper[target]('|    +--- org.slf4j:slf4j-api:1.7.25 -> 1.7.36 (*)\n', false)
        if (result !== '1.7.36') {
            return `${target}: ${result}`
        }
    },
    async () => {
        const target = 'matchVersion'
        const result = helper[target]('Project :vapi-service', false)
        if (result !== null) {
            return `${target}: A failed match should be null, ${result}`
        }
    },
    async () => {
        const target = 'matchVersion'
        const result = helper[target]("targetCompatibility = '11.11.11'", true)
        if (result !== null) {
            return `${target}: When guard is true then expect words like "Version" or "implementation"`
        }
    },
    async () => {
        const target = 'matchVersion'
        const result = helper[target]("implementation 'nexmoinc:nexmoinc:9.4.48'", true)
        if (result !== null) {
            return `${target}: When guard is true then reject words like "nexmoinc"`
        }
    },
    async () => {
        const target = 'getTempVersion'
        const result = helper[target]("1.1.1", 0)
        if (result !== '+') {
            return `${target}: when parts is 0 then tempVersion should be +, ${result}`
        }
    },
    async () => {
        const target = 'getTempVersion'
        const result = helper[target]("1.1.1", 1)
        if (result !== '1.+') {
            return `${target}: when parts is 0 then tempVersion should be 1.+, ${result}`
        }
    },
    async () => {
        const target = 'getTempVersion'
        const result = helper[target]("1.1.1", 2)
        if (result !== '1.1.+') {
            return `${target}: when parts is 0 then tempVersion should be 1.1.+, ${result}`
        }
    },
    async () => {
        const target = 'getTempVersion'
        const result = helper[target]("1.32", 2)
        if (result !== null) {
            return `${target}: When there is no third part then should return null, ${result}`
        }
    },
    async () => {
        const target = 'lookForFirstDiff'
        const leftArray = ['a', 'b', 'c', 'd', 'e', 'f']
        const rightArray = [...leftArray]
        rightArray[3] = 'D'

        const result = helper[target](leftArray, rightArray, 0)
        const pass = result.length === 2 && result[0] === 'd' && result[1] === 'D'
        if (!pass) {
            return `${target}: ${result}`
        }
    },
    async () => {
        const target = 'lookForFirstOccuranceOfPackage'

        const dependenciesArray = `
        +--- org.apache.httpcomponents:httpasyncclient:4.1.5 (*)
        +--- org.apache.httpcomponents:httpcore:4.4.15
        +--- org.apache.httpcomponents:fluent-hc:4.5.13
        |    +--- org.apache.httpcomponents:httpclient:4.5.13 (*)
        |    \--- commons-logging:commons-logging:1.2
        +--- io.jsonwebtoken:jjwt:0.9.1 (*)
        +--- com.couchbase.client:java-client:2.7.23
        |    \--- com.couchbase.client:core-io:1.7.23
        |         +--- io.reactivex:rxjava:1.3.8
        |         \--- io.opentracing:opentracing-api:0.31.0
        +--- io.prometheus:simpleclient:0.6.0`.split('\n')

        const lineContainingPackageName = '    implementation "io.jsonwebtoken:jjwt:0.6.0'
        const result = helper[target](dependenciesArray, lineContainingPackageName)

        if (result !== '        +--- io.jsonwebtoken:jjwt:0.9.1 (*)') {
            return `${target}: ${result}`
        }
    },
    async () => {
        const target = 'isNewVersionActuallyNewer'
        let error = '';
        [
            //It is newer:
            '2.0.0      1.0.0     true',
            '1.1.0      1.0.0     true',
            '1.0.1      1.0.0     true',
            '2.0.xx     1.0.xx    true',
            '1.1.xx     1.0.xx    true',
            '1.0.xx     1.0.yy    true',
            '1.0.x5     1.0.x6    true',
            '1.0.x6     1.0.x5    true',
            '1.0.5x     1.0.6x    true',
            '1.0.6x     1.0.5x    true',
            '1.1.1.1    1.1.1     true',
            
            //It is older:
            '1.0.0      2.0.0     false',
            '1.0.0      1.1.0     false',
            '1.0.0      1.0.1     false',
            '1.0.xx      2.0.xx     false',
            '1.0.xx      1.1.xx     false',
            
            //It is equal:
            '1.0.0      1.0.0     false',
            '1.0.xx     1.0.xx    false',

            //nulls:
            'null       1.0.0     false',
            '1.0.0      null      true',
            'null       null      false',
        ].forEach(testCase => {
            let [newVersion, oldVersion, expected] =
                testCase.split(/\s+/g).map(x => +x[0] ? x : JSON.parse(x))

            if (helper[target](newVersion, oldVersion) !== expected) {
                error += `${target}: ${testCase}\n`
            }
        })
        return error
    },
    async () => {
        const target = 'cleanUpLine'
        const result = helper[target](`
        a'b'c "d"e\t
        `)
        if (result !== 'abc de') {
            return `${target}: ${result}`
        }
    },
    


// def isNewVersionActuallyNewer(newVersion, oldVersion):
//     if not newVersion or not oldVersion or oldVersion == newVersion:
//         return False
//     i = 0
//     while i < 5:
//         newInt = getFoo(newVersion, i)
//         oldInt = getFoo(oldVersion, i)
//         if newInt == None or oldInt == None:
//             break
//         if newInt > oldInt:
//             return True
//         if newInt < oldInt:
//             return False
//         i += 1
//     return True

]   


module.exports = tests
