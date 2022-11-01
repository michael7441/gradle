import helper
import os.path

gradleFile = "./vapi-service/build.gradle"
if not os.path.isfile(gradleFile):
    gradleFile = "./build.gradle"
print('gradleFile:', gradleFile)

helper.commandPrint("touch ./bot/previouslyFailedTheBuild")

lines = open(gradleFile, "r").readlines()
length = len(lines)
print('length', length)
  
print('# Cache gradleDependancies:')
for parts in [2, 1, 0]:
    lineNumber = 0
    linesCopy = lines.copy()
    while lineNumber < length:
        line = linesCopy[lineNumber]
        oldVersion = helper.matchVersion(line, True)
        tempVersion = helper.getTempVersion(oldVersion, parts)
        if oldVersion and tempVersion:
            print(line + '     ' + oldVersion + '   ' + tempVersion)
            linesCopy[lineNumber] = line.replace(oldVersion, tempVersion)
        lineNumber += 1
    open(gradleFile, "w").writelines(linesCopy)

    helper.command("""
        dependenciesFile="./bot/parts{0}"
        ./bot/dependancies.sh > $dependenciesFile
    """.format(parts))

print('# Test each line with each part:')
lineNumber = 0
while lineNumber < length:
    line = lines[lineNumber]
    print('\n====================================\n' + line + '\n====================================')
    print(helper.matchVersion(line, True))
    if helper.matchVersion(line, True):
        for parts in [2, 1, 0]:
            command = "python3 ./bot/processLine.py {0} {1} {2}".format(lineNumber, parts, gradleFile)
            print(command)
            r = helper.commandPrint(command)
            if 'SUCCESS_NEW_VERSION_COMMITED' in r:
                break
    lineNumber += 1

