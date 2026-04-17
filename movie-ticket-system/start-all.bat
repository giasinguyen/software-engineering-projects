@echo off
setlocal

set RABBITMQ_URI=amqps://cucfpjwl:Jbwwm-HQWFMdIqi2pExZyZOjmi1AnF2D@armadillo.rmq.cloudamqp.com/cucfpjwl
set ROOT=%~dp0

echo Starting all services...

:: User Service
start "User Service :8081" cmd /k "cd /d %ROOT%backend\user-service && set RABBITMQ_URI=%RABBITMQ_URI% && mvn spring-boot:run"

:: Movie Service
start "Movie Service :8082" cmd /k "cd /d %ROOT%backend\movie-service && mvn spring-boot:run"

:: Booking Service
start "Booking Service :8083" cmd /k "cd /d %ROOT%backend\booking-service && set RABBITMQ_URI=%RABBITMQ_URI% && mvn spring-boot:run"

:: Payment + Notification Service
start "Payment+Notification :8084" cmd /k "cd /d %ROOT%backend\payment-notification-service && npm run dev"

:: Frontend
start "Frontend :5173" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo All services started in separate windows.
