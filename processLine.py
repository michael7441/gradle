import sys
import helper

lineNumber = int(sys.argv[1])
parts = int(sys.argv[2])
gradleFile = sys.argv[3]
print('lineNumber:', lineNumber)
print('     parts:', parts)
print('gradleFile:', gradleFile)
print()

lines = open(gradleFile, "r").readlines()
line = lines[lineNumber]
print('line', line)

oldVersion = helper.matchVersion(line, True)
if not oldVersion:
    helper.fail('no old version')
tempVersion = helper.getTempVersion(oldVersion, parts)
print('tempVersion', tempVersion)
if not tempVersion:
    helper.fail('no temp version')

oldDependencies = helper.command("""
    dependenciesFile=./bot/dependancies
    if grep -q $(git rev-parse HEAD) $dependenciesFile; then
      echo 'dependancies hash hit'
    else
      echo 'dependancies hash miss'
      ./gradlew vapi-service:dependencies --no-daemon > $dependenciesFile
      echo "$(git rev-parse HEAD)" >> $dependenciesFile
    fi
    cat $dependenciesFile
""").split('\n')

newVersion = None

if 'testImplementation' in line or 'implementation' in line or 'compile' in line:
    f = "./bot/parts{0}".format(parts)
    newDependencies = open(f, "r").readlines()
    newVersion = helper.lookForFirstOccurance(newDependencies, line)
else:
    lines[lineNumber] = line.replace(oldVersion, tempVersion)
    open(gradleFile, "w").writelines(lines)
    newDependencies = helper.command("./gradlew vapi-service:dependencies --no-daemon").split('\n')
    newVersion = helper.lookForFirstDiffVersion(oldDependencies, newDependencies)

print('newVersion', newVersion)
if (not helper.isNewVersionActuallyNewer(newVersion, oldVersion)):
    helper.fail('no new version')

lines[lineNumber] = line.replace(oldVersion, newVersion)


if lines[lineNumber] in open("./bot/previouslyFailedTheBuild", "r").read():
    helper.fail('previouslyFailedTheBuild')

open(gradleFile, "w").writelines(lines)

unitTestResult = helper.runUnitTests()
if 'BUILD SUCCESSFUL' not in unitTestResult:
    open("./bot/previouslyFailedTheBuild", 'a').write(lines[lineNumber] + '\n')
    helper.fail('unit test not success')

helper.command("""
git add {2}
git commit -m 'gradle-bot: {0} -> {1}'
""".format(helper.cleanUpLine(line), helper.cleanUpLine(lines[lineNumber]), gradleFile))

print('SUCCESS_NEW_VERSION_COMMITED')

# helper.commandPrint("""
# # git status
# git diff
# """)
