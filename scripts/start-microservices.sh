#!/bin/bash

# Formul8 Microservice Startup Script
# This script starts all microservices and monitors them

set -e

echo "🚀 Formul8 Microservice Manager"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the formul8-multiagent directory"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    
    if [ -n "$port" ]; then
        curl -s "http://localhost:$port/health" > /dev/null 2>&1
    else
        pgrep -f "$service_name" > /dev/null 2>&1
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local repo=$2
    local port=$3
    local start_cmd=$4
    
    echo "🔍 Checking $service_name..."
    
    if check_service "$service_name" "$port"; then
        echo "✅ $service_name is already running"
        return 0
    fi
    
    echo "🚀 Starting $service_name..."
    
    # Check if directory exists, clone if not
    if [ ! -d "../$service_name" ]; then
        echo "📥 Cloning $repo..."
        gh repo clone "$repo" "../$service_name" || echo "⚠️  Failed to clone $repo"
    fi
    
    # Install dependencies if needed
    if [ -f "../$service_name/package.json" ]; then
        echo "📦 Installing dependencies for $service_name..."
        (cd "../$service_name" && npm install) || echo "⚠️  Failed to install dependencies for $service_name"
    fi
    
    # Start the service
    if [ -n "$start_cmd" ]; then
        echo "🚀 Starting $service_name with: $start_cmd"
        (cd "../$service_name" && nohup $start_cmd > "logs/$service_name.log" 2>&1 &)
        echo "✅ $service_name started (PID: $!)"
    else
        echo "⚠️  No start command configured for $service_name"
    fi
}

# Service configurations (using simple arrays instead of associative arrays)
services=(
    "compliance-agent:f8ai/compliance-agent:3001:npm start"
    "formulation-agent:f8ai/formulation-agent:3002:npm start"
    "operations-agent:f8ai/operations-agent:3004:npm start"
    "marketing-agent:f8ai/marketing-agent:3005:npm start"
    "sourcing-agent:f8ai/sourcing-agent:3006:npm start"
    "patent-agent:f8ai/patent-agent:3007:npm start"
    "spectra-agent:f8ai/spectra-agent:3008:npm start"
    "customer-success-agent:f8ai/customer-success-agent:3009:npm start"
    "f8-slackbot:f8ai/f8-slackbot:3010:npm start"
    "mcr-agent:f8ai/mcr-agent:3011:npm start"
    "ad-agent:f8ai/ad-agent:3012:npm start"
)

# Parse command line arguments
case "${1:-start}" in
    start)
        echo "🚀 Starting all microservices..."
        for service_config in "${services[@]}"; do
            IFS=':' read -r service_name repo port start_cmd <<< "$service_config"
            start_service "$service_name" "$repo" "$port" "$start_cmd"
            sleep 2  # Wait between starts
        done
        echo ""
        echo "✅ All services started!"
        echo "📊 Run 'npm run status-services' to check status"
        echo "📋 Run 'npm run microservice logs <service>' to view logs"
        ;;
    
    stop)
        service_name=${2:-}
        if [ -n "$service_name" ]; then
            echo "🛑 Stopping $service_name..."
            pkill -f "$service_name" || echo "⚠️  $service_name not running"
        else
            echo "🛑 Stopping all services..."
            for service_config in "${services[@]}"; do
                IFS=':' read -r service_name repo port start_cmd <<< "$service_config"
                echo "🛑 Stopping $service_name..."
                pkill -f "$service_name" || echo "⚠️  $service_name not running"
            done
        fi
        echo "✅ Services stopped"
        ;;
    
    status)
        echo "📊 Service Status:"
        echo "=================="
        for service_config in "${services[@]}"; do
            IFS=':' read -r service_name repo port start_cmd <<< "$service_config"
            if check_service "$service_name" "$port"; then
                echo "✅ $service_name: Running (port $port)"
            else
                echo "❌ $service_name: Stopped"
            fi
        done
        ;;
    
    restart)
        service_name=${2:-}
        if [ -n "$service_name" ]; then
            echo "🔄 Restarting $service_name..."
            pkill -f "$service_name" || true
            sleep 2
            for service_config in "${services[@]}"; do
                IFS=':' read -r s_name repo port start_cmd <<< "$service_config"
                if [ "$s_name" = "$service_name" ]; then
                    start_service "$service_name" "$repo" "$port" "$start_cmd"
                    break
                fi
            done
        else
            echo "❌ Please specify a service name to restart"
        fi
        ;;
    
    logs)
        service_name=${2:-}
        if [ -n "$service_name" ]; then
            echo "📋 Logs for $service_name:"
            echo "=========================="
            if [ -f "logs/$service_name.log" ]; then
                tail -n 50 "logs/$service_name.log"
            else
                echo "No logs found for $service_name"
            fi
        else
            echo "❌ Please specify a service name to view logs"
        fi
        ;;
    
    help)
        echo "🤖 Formul8 Microservice Manager"
        echo ""
        echo "Usage: $0 [command] [service]"
        echo ""
        echo "Commands:"
        echo "  start [service]    Start all services or specific service"
        echo "  stop [service]     Stop all services or specific service"
        echo "  restart <service>  Restart specific service"
        echo "  status            Show status of all services"
        echo "  logs <service>    Show logs for specific service"
        echo "  help              Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 start compliance-agent"
        echo "  $0 restart formulation-agent"
        echo "  $0 status"
        echo "  $0 logs formulation-agent"
        ;;
    
    *)
        echo "❌ Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac
