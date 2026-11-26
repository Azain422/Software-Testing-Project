pipeline {
    agent any

    environment {
        IMAGE_NAME = 'playwright-tests:jenkins-test'
        CONTAINER_NAME = "playwright-tests-jenkins-${BUILD_NUMBER}"
    }

    triggers {
        // GitHub webhook (needs "GitHub hook trigger for GITScm polling" set up as in Part 08)
        githubPush()
        // nightly run as well
        cron('H 2 * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Clean Old Results') {
            steps {
                bat '''
                if exist allure-results rmdir /s /q allure-results
                if exist playwright-report rmdir /s /q playwright-report
                if exist screenshots rmdir /s /q screenshots
                if exist logs rmdir /s /q logs
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %IMAGE_NAME% .'
            }
        }

        stage('Run UI and API Tests') {
            steps {
                script {
                    // keep going on test failures so the report still gets copied and published
                    env.TEST_EXIT_CODE = bat(
                        returnStatus: true,
                        script: 'docker run --name %CONTAINER_NAME% -e CI=true %IMAGE_NAME%'
                    ).toString()
                }
            }
        }

        stage('Copy Results From Container') {
            steps {
                bat '''
                docker cp %CONTAINER_NAME%:/app/allure-results ./allure-results
                docker cp %CONTAINER_NAME%:/app/playwright-report ./playwright-report
                docker cp %CONTAINER_NAME%:/app/screenshots ./screenshots
                docker cp %CONTAINER_NAME%:/app/logs ./logs
                '''
            }
        }
    }

    post {
        always {
            allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]

            publishHTML(target: [
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright HTML Report',
                keepAll: true,
                alwaysLinkToLastBuild: true,
                allowMissing: true
            ])

            archiveArtifacts artifacts: 'screenshots/**, logs/**', allowEmptyArchive: true

            bat(returnStatus: true, script: 'docker rm %CONTAINER_NAME%')

            script {
                if (env.TEST_EXIT_CODE != '0') {
                    currentBuild.result = 'FAILURE'
                    echo 'PLAYWRIGHT TESTS FAILED'
                } else {
                    echo 'PLAYWRIGHT TESTS PASSED'
                }
            }
        }
    }
}
