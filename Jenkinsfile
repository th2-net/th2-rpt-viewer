pipeline {
    agent { label "sailfish" }
    tools {
        jdk 'openjdk-11.0.2'
    }
    environment {
        VERSION_MAINTENANCE = """${sh(
                            returnStdout: true,
                            script: 'git rev-list --count VERSION-1.0..HEAD'
                            ).trim()}""" //TODO: Calculate revision from a specific tag instead of a root commit
        NEXUS = credentials('docker-user_nexus.exp.exactpro.com_9000')
        NEXUS_URL = 'nexus.exactpro.com:9000'
        GRADLE_SWITCHES = " -Pversion_build=${BUILD_NUMBER} -Pversion_maintenance=${VERSION_MAINTENANCE}"
        GCHAT_WEB_HOOK = credentials('th2-dev-environment-web-hook')
        GCHAT_THREAD_NAME = credentials('th2-dev-environment-release-docker-images-thread')
    }
    stages {
//         stage('Build') {
//             steps {
//                 sh """
//                     ./gradlew clean build ${GRADLE_SWITCHES}
//                 """
//             }
//         }
        stage('Publish') {
            steps {
                // publish via docker cli image to Nexus
                sh """
                    docker login -u ${NEXUS_USR} -p ${NEXUS_PSW} ${NEXUS_URL}
                    ./gradlew clean dockerPush dockerPushRemote-latest -Pdownload_node ${GRADLE_SWITCHES}
                    docker logout ${NEXUS_URL}
                """ // TODO: Exec from root repository
            }
        }
        stage('Publish report') {
            steps {
                script {
                    def gradleProperties = readProperties  file: 'gradle.properties'
                    def dockerImageVersion = "${gradleProperties['version_major']}.${gradleProperties['version_minor']}.${VERSION_MAINTENANCE}.${BUILD_NUMBER}"

                    def changeLogs = ""
                    try {
                        def changeLogSets = currentBuild.changeSets
                        for (int changeLogIndex = 0; changeLogIndex < changeLogSets.size(); changeLogIndex++) {
                            def entries = changeLogSets[changeLogIndex].items
                            for (int itemIndex = 0; itemIndex < entries.length; itemIndex++) {
                                def entry = entries[itemIndex]
                                changeLogs += "\n${entry.msg}"
                            }
                        }
                    } catch(e) {
                        println "Exception occurred: ${e}"
                    }

                    def fields = [
                        "*Job:* <${BUILD_URL}|${JOB_NAME}>",
                        "*Docker image version:* ${dockerImageVersion}",
                        "*Changes:*${changeLogs}"
                    ]
                    writeJSON file: 'result.json', json: [text: fields.join('\n'), thread: [name: GCHAT_THREAD_NAME]]
                    try {
                        sh "curl -s -H 'Content-Type: application/json' -d @result.json '${GCHAT_WEB_HOOK}'"
                    } catch(e) {
                        println "Exception occurred: ${e}"
                    }

                    currentBuild.description = "docker-image-version = ${dockerImageVersion}<br>"
                }
            }
        }
    }
}
