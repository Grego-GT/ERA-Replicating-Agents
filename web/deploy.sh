#!/bin/bash

# ERA Fly.io Deployment Script

set -e

echo "🏭 ERA Deployment to Fly.io"
echo "=================================="
echo ""

# Check if flyctl is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly.io CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  brew install flyctl  (macOS)"
    echo "  curl -L https://fly.io/install.sh | sh  (Linux)"
    echo ""
    exit 1
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo ""
    echo "Please login first:"
    echo "  fly auth login"
    echo ""
    exit 1
fi

echo "✅ Fly.io CLI found and authenticated"
echo ""

# Check if app exists
if fly status &> /dev/null; then
    echo "📦 App exists. Deploying update..."
    fly deploy --ha=false
else
    echo "🆕 First time deployment. Launching app..."
    fly launch --no-deploy --ha=false
    
    echo ""
    echo "⚙️  Configuring app..."
    
    # Optional: Set secrets
    read -p "Do you want to set WANDB_API_KEY? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter WANDB_API_KEY: " wandb_key
        fly secrets set WANDB_API_KEY="$wandb_key"
    fi
    
    read -p "Do you want to set DAYTONA_API_KEY? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter DAYTONA_API_KEY: " daytona_key
        fly secrets set DAYTONA_API_KEY="$daytona_key"
    fi
    
    echo ""
    echo "🚀 Deploying..."
    fly deploy --ha=false
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 App status:"
fly status

echo ""
echo "🌐 Opening app in browser..."
fly open

echo ""
echo "💡 Useful commands:"
echo "  fly logs              - View logs"
echo "  fly status            - Check status"
echo "  fly dashboard         - Open dashboard"
echo "  fly ssh console       - SSH into the machine"
echo ""

