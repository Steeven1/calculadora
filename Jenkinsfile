pipeline {
    agent any

    environment {
        NODE_ENV = 'production' // Configurar el entorno de producción
        SONARQUBE_NAME = 'sonarqube' // Configura tu servidor SonarQube en Jenkins
        // Obtén el token de SonarQube de las credenciales de Jenkins
        //SONAR_TOKEN = credentials('spdp-calculators')
    	SONAR_HOME = tool 'sonarqube'
        SNYK_HOME = tool 'snyk'
        SNYK_TOKEN = credentials('snyk-api-token')
    }
    
   

    stages {
	
	stage('Clone sources'){
	   steps {
	     git branch: 'main', changelog: false, credentialsId: 'modelos-zero-u-p', url: 'https://github.com/Steeven1/calculadora.git'
	   }
	}
	
    stage('Analyce of SonarQube quality') {
        steps {
                script {
                    // Ejecutar análisis de código con SonarQube
                    // SonarQube debe estar configurado en Jenkins (sonar.properties configurado correctamente)
                    // Configurar el análisis de SonarQube
                    //Preparar los archivos para el análisis (si usas algún script como `sonar:prepare`)
                    //npm run sonar:prepare  
                    // Ejecutar el análisis de SonarQube
                    //withSonarQubeEnv('SonarScanner') to refers name SonarQube installations
                    withSonarQubeEnv(env.SONARQUBE_NAME){
                    sh '''                    
                    ${SONAR_HOME}/bin/sonar-scanner  \
                        -Dsonar.projectKey=modelos-zero \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=**/node_modules/**,**/dist/**,**.xlsx,package-lock.json,package.json\
                        -Dsonar.qualitygate.wait=true
                    '''
                    }
                }
            }
        }

        stage('Test dependencies with Snyk') {
            steps {
             
                snykSecurity(nstallation Name>',
                snykTokenId: '<Your Snyk API Token ID>',
                // place other optional parameters here, for example:
                additionalArguments:
                 '--severity-threshold=high
                 -d
                 '
                )
            }
        }

                snykInstallation: '<Your Snyk I

        stage('Construir Proyecto') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'dokploy-webhook-url', 
                        variable: 'DOKPLOY_WEBHOOK')
                ]) {
                    sh 'curl -X POST "$DOKPLOY_WEBHOOK"'
                }
            }
        }

        //stage('Pruebas') {
        //    steps {
         //       script {
                    // Ejecutar pruebas si tienes alguna configurada (opcional)
                    // Si no tienes pruebas, puedes omitir este paso
         //           sh 'npm run test' // O el comando adecuado para tus pruebas
         //       }
         //   }
        //}

        
        
        stage('Merge to Target Branch') {
            when {
                expression { currentBuild.result == 'SUCCESS' } // Solo se ejecuta si todas las etapas anteriores tienen éxito
            }
            steps {
                script {
                    echo "Fusionando feat/test en main..."
                    
                    // Cambiar a la rama destino
                    sh "git checkout main"           
                    
                    // Fusionar la rama fuente en la rama destino
                    sh "git merge feature/test"
                    
                    // Empujar los cambios al repositorio remoto
                    sh "git push origin main"
                }
            }
        }
    }

    post {
        success {
            // Acción a realizar cuando todo salga bien
            echo '¡Construcción y despliegue exitosos!'
        }
        failure {
            // Acción a realizar cuando haya un fallo
            echo 'Hubo un error durante el proceso.'
        }
    }
}