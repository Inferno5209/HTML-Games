#!/usr/bin/env python3
"""
Test script for Google OAuth authentication endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_auth_status():
    """Test the authentication status endpoint"""
    print("Testing /auth/status...")
    response = requests.get(f"{BASE_URL}/auth/status")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_upload_without_auth():
    """Test upload endpoint without authentication"""
    print("Testing /upload without authentication...")
    response = requests.post(f"{BASE_URL}/upload")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_videos_endpoint():
    """Test the videos endpoint"""
    print("Testing /videos...")
    response = requests.get(f"{BASE_URL}/videos")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_google_auth_with_invalid_token():
    """Test Google auth with invalid token"""
    print("Testing /auth/google with invalid token...")
    response = requests.post(
        f"{BASE_URL}/auth/google",
        json={"id_token": "invalid_token"},
        headers={"Content-Type": "application/json"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

if __name__ == "__main__":
    print("Testing VoG Connect Authentication Endpoints")
    print("=" * 50)
    
    test_auth_status()
    test_upload_without_auth()
    test_videos_endpoint()
    test_google_auth_with_invalid_token()
    
    print("All tests completed!")
    print("\nTo test with real Google OAuth:")
    print("1. Follow the setup guide in setup-google-oauth.md")
    print("2. Update your Google Client ID in student-upload.html and app.py")
    print("3. Open http://localhost:5000/student-upload.html in your browser")
    print("4. Click 'Sign in with Google' and complete the OAuth flow")
