import uuid
import csv
import os
import logging
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# CRITICAL: Imports functions from llm_service.py
# If you don't have this file, the placeholders below will raise an error.
try:
    from backend.llm_service import upload_timesheet_to_db, get_timesheet_data_from_db, get_llm_response
except ImportError as e:
    logging.error(f"FATAL: Failed to import llm_service.py. Check file location. Error: {e}")
    # Define placeholder functions to avoid server crash on import
    def upload_timesheet_to_db(df): raise RuntimeError("LLM service module not found.")
    def get_timesheet_data_from_db(): return pd.DataFrame()
    def get_llm_response(user_query): return "LLM service unavailable."

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app) 

USERS_FILE = 'users.csv'
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

users = {}
chat_history = {} 

# --- UTILITY FUNCTIONS (Authentication) ---

def load_users():
    """Loads all user data (7 fields) from the CSV. Robust to missing data in older files."""
    users_data = {}
    if os.path.exists(USERS_FILE):
        try:
            # IMPORTANT: Define all 7 field names for DictReader
            fieldnames = ['username', 'password_hash', 'full_name', 'email', 'phone_number', 'country', 'session_token']
            with open(USERS_FILE, 'r', newline='') as f:
                reader = csv.DictReader(f, fieldnames=fieldnames)
                next(reader, None) # Skip the header row
                
                for row in reader:
                    if row and row.get('username'):
                         users_data[row['username']] = {
                            'password_hash': row.get('password_hash'), 
                            'full_name': row.get('full_name'), 
                            'email': row.get('email'), 
                            'phone_number': row.get('phone_number'), # ADDED
                            'country': row.get('country'),             # ADDED
                            'session_token': row.get('session_token', None) 
                         }
        except Exception as e:
            logging.error(f"Error reading users file: {e}. Check if users.csv structure is correct.")
            return {} 
    return users_data

def save_users_to_file(users_data):
    """Saves the complete user data map back to the CSV file with all 7 fields."""
    fieldnames = ['username', 'password_hash', 'full_name', 'email', 'phone_number', 'country', 'session_token']
    final_data = []
    for username, data in users_data.items():
        row = {
            'username': username,
            'password_hash': data.get('password_hash'),
            'full_name': data.get('full_name'),
            'email': data.get('email'),
            'phone_number': data.get('phone_number'),
            'country': data.get('country'),
            'session_token': data.get('session_token')
        }
        final_data.append(row)

    try:
        with open(USERS_FILE, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(final_data)
        return True
    except Exception as e:
        logging.error(f"Error saving users to file: {e}")
        return False

# --- AUTHENTICATION ROUTES ---

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    global users
    users = load_users() 

    user_data = users.get(username)

    if user_data and check_password_hash(user_data.get('password_hash', ''), password):
        session_token = str(uuid.uuid4())
        users[username]['session_token'] = session_token 
        save_users_to_file(users)
        return jsonify({"message": "Login successful", "session_token": session_token}), 200
    else:
        return jsonify({"error": "Invalid username or password."}), 401

@app.route('/signup', methods=['POST'])
def signup():
    """Handles new user registration and persists all 7 data fields to users.csv."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    email = data.get('email')
    phone_number = data.get('phone_number')
    country = data.get('country')
    
    global users
    users = load_users()

    # Check that all 6 input fields are present
    if not all([username, password, full_name, email, phone_number, country]): 
         return jsonify({"error": "Missing required fields."}), 400

    if username in users:
        return jsonify({"error": f"Username '{username}' already exists."}), 409

    password_hash = generate_password_hash(password)

    users[username] = {
        'password_hash': password_hash,
        'full_name': full_name,
        'email': email,
        'phone_number': phone_number,
        'country': country,
        'session_token': None # Always None at signup
    }
    
    save_users_to_file(users)
    
    return jsonify({
        "message": "Sign-up successful! Please log in now.", 
        "username": username
    }), 201
    
# ... (Other routes like /verify_username, /reset_password, /upload, /chat, /chat_history remain the same)

def get_user_from_token(session_token):
    for username, data in users.items():
        if data.get('session_token') == session_token:
            return username
    return None

def authenticate_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, jsonify({"error": "Authorization token required."}), 401
    
    session_token = auth_header.split(' ')[1] 
    global users
    users = load_users() 
    username = get_user_from_token(session_token)

    if not username:
        return None, jsonify({"error": "Invalid or expired session token."}), 401
    
    return username, None, None

@app.route('/upload', methods=['POST'])
def upload_file():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code
    # ... rest of upload_file ...
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    # ... (omitted for brevity, assume the file handling logic is correct)
    return jsonify({"error": "File upload failed due to unknown error."}), 500


@app.route('/chat', methods=['POST'])
def chat():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code
    # ... rest of chat ...
    try:
        # ... (omitted for brevity, assume the chat handling logic is correct)
        pass 
    except Exception as e:
        return jsonify({"error": f"An internal server error occurred during chat: {str(e)}"}), 500
    return jsonify({"answer": "Placeholder response"}), 200 # Placeholder


@app.route('/chat_history', methods=['GET'])
def get_chat_history():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code
    
    history = chat_history.get(username, [])
    return jsonify({"history": history}), 200


# --- MAIN EXECUTION FIX (Resolved AttributeError) ---
def initialize_app():
    """
    Ensures the users.csv file is initialized with the correct 7-field header 
    if it doesn't exist, and loads the initial user data.
    """
    if not os.path.exists(USERS_FILE):
        # Correct 7-field header definition
        fieldnames = ['username', 'password_hash', 'full_name', 'email', 'phone_number', 'country', 'session_token']
        try:
            with open(USERS_FILE, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
        except Exception as e:
            logging.error(f"Failed to create users.csv file: {e}")
            
    # Load users immediately after checking/creating the file
    global users
    users = load_users()

# Execute the initialization function directly (FIX)
# This replaces the deprecated @app.before_first_request decorator.
initialize_app() 


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)