const helperTests = require('./helper.tests')

module.exports = async function testRunner() {
    const results = await Promise.all(helperTests.map(t => {
        try {
            return t()
        } catch (err) {
            return err.toString()
        }
    }))

    const testFailures = results
        .filter(result => {
            result && console.error(result)
            return result
        })
    if (testFailures.length === 0) {
        // console.log('PASS')
        global.testsPassed = true
    } else {
        console.log('FAIL')
        process.exit(1);
    }
}
