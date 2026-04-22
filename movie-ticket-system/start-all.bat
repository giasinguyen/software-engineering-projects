@echo off
setlocal

set RABBITMQ_HOST=localhost
set RABBITMQ_PORT=5672
set RABBITMQ_USERNAME=guest
set RABBITMQ_PASSWORD=guest
set RABBITMQ_VHOST=/
set RABBITMQ_SSL=false
set RABBITMQ_URI=amqp://guest:guest@localhost:5672/
set MAVEN_OPTS=
set ROOT=%~dp0

echo Starting all services...

:: User Service
start "User Service :8081" cmd /k "cd /d %ROOT%backend\user-service && mvn spring-boot:run"

:: Movie Service
start "Movie Service :8082" cmd /k "cd /d %ROOT%backend\movie-service && mvn spring-boot:run"

:: Booking Service
start "Booking Service :8083" cmd /k "cd /d %ROOT%backend\booking-service && mvn spring-boot:run"

:: Payment + Notification Service
start "Payment+Notification :8084" cmd /k "cd /d %ROOT%backend\payment-notification-service && npm run dev"

:: Frontend
start "Frontend :5173" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo All services started in separate windows.
