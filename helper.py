import re
import subprocess

def command(s):
    return subprocess.getoutput(s)

def commandPrint(s):
    r = command(s)
    print(r)
    return r

def matchLastOccurance(regex, s):
    it = re.finditer(regex, s)
    result = None
    i = 0
    while i < 10:
        try:
            result = next(it)[0]
        except:
            break
        i += 1
    return result

def matchFirstOccurance(regex, s):
    it = re.finditer(regex, s)
    try:
        return next(it)[0]
    except:
        return None

def matchVersion(s, guard):
    if guard:
        ok = 'Version' in s or 'testImplementation' in s or 'implementation' in s or 'compile' in s
        if not ok:
            return None
        if 'nexmoinc' in s or 'info.solidsoft.pitest' in s or 'org.ajoberstar.grgit' in s or 'classpath ' in s or 'id ' in s or 'pitestVersion' in s or 'rtcVersion' in s:
            return None
    regex = r'\b(\d+\.)+[^\s"\':]+'
    return matchLastOccurance(regex, s)

def getTempVersion(oldVersion, parts):
    if parts not in [0, 1, 2]:
        return None
    if (parts == 0):
        return '+'
    regex = r'[^.]+\.'
    if parts == 2:
        regex = regex + regex
    try:
        return matchFirstOccurance(regex, oldVersion) + '+'
    except:
        return None

def lookForFirstDiffVersion(oldDependencies, newDependencies):
    i = 0
    while i < len(oldDependencies) and i < len(newDependencies):
        if (oldDependencies[i] != newDependencies[i]):
            return matchVersion(newDependencies[i], False)
        i += 1

def lookForFirstOccurance(newDependencies, line):
    package = matchFirstOccurance(r'[^"\':]+:[^"\':]+', line) + ':'
    i = 0
    while i < len(newDependencies):
        if package in newDependencies[i]:
            return matchVersion(newDependencies[i], False)
        i += 1

def fail(reason):
    reason = 'FAIL: ' + reason
    print(reason)
    command("git reset --hard")
    raise SystemExit(reason)

def runUnitTests():
    print()
    print('runUnitTests()')
    return commandPrint('./gradlew test --no-daemon')

def isNewVersionActuallyNewer(newVersion, oldVersion):
    if not newVersion or not oldVersion or oldVersion == newVersion:
        return False
    i = 0
    while i < 5:
        newInt = getFoo(newVersion, i)
        oldInt = getFoo(oldVersion, i)
        if newInt == None or oldInt == None:
            break
        if newInt > oldInt:
            return True
        if newInt < oldInt:
            return False
        i += 1
    return True

def getFoo(version, i):
    try:
        return int(version.split('.')[i])
    except:
        return None

def cleanUpLine(line):
    return line.replace("'", "").replace('"', "").strip()

