#!/usr/bin/env python3
"""
Script to start both the Flask backend and React frontend servers
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    print("Checking dependencies...")
    
    # Check if npm is installed
    try:
        subprocess.run(["npm", "--version"], check=True, capture_output=True)
        print("✓ npm is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ npm is not installed. Please install Node.js and npm.")
        return False
    
    # Check if Python packages are installed
    try:
        import flask
        import pandas
        import sklearn
        print("✓ Python packages are installed")
    except ImportError as e:
        print(f"✗ Missing Python package: {e}")
        print("Please run: cd backend && pip install -r requirements.txt")
        return False
    
    return True

def install_frontend_dependencies():
    """Install frontend dependencies if needed"""
    if not os.path.exists("node_modules"):
        print("Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True)
        print("✓ Frontend dependencies installed")
    else:
        print("✓ Frontend dependencies already installed")

def start_backend():
    """Start the Flask backend server"""
    print("Starting Flask backend server...")
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("✗ Backend directory not found")
        return None
    
    try:
        # Start Flask server
        backend_process = subprocess.Popen(
            [sys.executable, "app.py"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a moment for server to start
        time.sleep(3)
        
        if backend_process.poll() is None:
            print("✓ Flask backend server started on http://localhost:5000")
            return backend_process
        else:
            stdout, stderr = backend_process.communicate()
            print(f"✗ Failed to start backend: {stderr}")
            return None
            
    except Exception as e:
        print(f"✗ Error starting backend: {e}")
        return None

def start_frontend():
    """Start the React frontend server"""
    print("Starting React frontend server...")
    
    try:
        # Start React dev server
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a moment for server to start
        time.sleep(5)
        
        if frontend_process.poll() is None:
            print("✓ React frontend server started on http://localhost:8080")
            return frontend_process
        else:
            stdout, stderr = frontend_process.communicate()
            print(f"✗ Failed to start frontend: {stderr}")
            return None
            
    except Exception as e:
        print(f"✗ Error starting frontend: {e}")
        return None

def main():
    """Main function to start both servers"""
    print("🚀 Starting InnoAisle - Walmart Store Intelligence Platform")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Install frontend dependencies if needed
    install_frontend_dependencies()
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        sys.exit(1)
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        backend_process.terminate()
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 Both servers are running!")
    print("📊 Frontend: http://localhost:8080")
    print("🔧 Backend:  http://localhost:5000")
    print("📁 Upload your CSV data to see real ML insights!")
    print("\nPress Ctrl+C to stop both servers")
    print("=" * 60)
    
    try:
        # Keep both processes running
        while True:
            time.sleep(1)
            
            # Check if either process has died
            if backend_process.poll() is not None:
                print("✗ Backend server stopped unexpectedly")
                frontend_process.terminate()
                break
                
            if frontend_process.poll() is not None:
                print("✗ Frontend server stopped unexpectedly")
                backend_process.terminate()
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("✓ Servers stopped")

if __name__ == "__main__":
    main() 