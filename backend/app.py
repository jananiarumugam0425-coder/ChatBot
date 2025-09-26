import os
import logging
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime
from uuid import uuid4 # <-- FIX: Changed from 'import uuid' to be specific

# CRITICAL: Import all necessary functions from the service file
try:
    from backend.llm_service import (
        upload_timesheet_to_db, 
        get_timesheet_data_from_db, 
        get_llm_response,
        # MongoDB Auth Functions
        create_user,
        verify_user,
        get_user_by_token,
        get_user_data_by_username,
        update_password
    )
except ImportError as e:
    logging.error(f"FATAL: Failed to import llm_service.py or its functions. Error: {e}")
    # Define placeholder functions to prevent server crash
    def upload_timesheet_to_db(df): raise RuntimeError("LLM service module not found.")
    def get_timesheet_data_from_db(): return pd.DataFrame()
    def get_llm_response(user_query): return "LLM service unavailable."
    # Define placeholder auth functions
    def create_user(*args, **kwargs): raise RuntimeError("Auth service unavailable.")
    def verify_user(*args, **kwargs): return None, None
    def get_user_by_token(*args, **kwargs): return None
    def get_user_data_by_username(*args, **kwargs): return None
    def update_password(*args, **kwargs): return False

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app) 

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Global chat history remains in memory for the duration of the server process
chat_history = {} 

# --- AUTHENTICATION ROUTES (MIGRATED TO MONGODB) ---

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Use the MongoDB function to verify credentials and generate a token
    session_token, verified_username = verify_user(username, password)

    if session_token:
        # Verified_username is returned from the verify_user function
        return jsonify({
            "message": "Login successful", 
            "session_token": session_token,
            "username": verified_username
        }), 200
    else:
        return jsonify({"error": "Invalid username or password."}), 401

@app.route('/signup', methods=['POST'])
def signup():
    """Handles new user registration and persists all 6 required fields to MongoDB."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    email = data.get('email')
    phone_number = data.get('phone_number')
    country = data.get('country')
    
    # Check that all 6 input fields are present
    if not all([username, password, full_name, email, phone_number, country]): 
          return jsonify({"error": "Missing required fields."}), 400

    # Call the MongoDB creation function
    success = create_user(username, password, full_name, email, phone_number, country)
    
    if success:
        return jsonify({
            "message": "Sign-up successful! Please log in now.", 
            "username": username
        }), 201
    else:
        # 'success' is False if the user already existed or a DB error occurred
        return jsonify({"error": f"Username '{username}' already exists or a database error occurred."}), 409
    
# -------------------------------------------------------------
# 🔑 --- PASSWORD RESET ROUTES (MIGRATED TO MONGODB) --- 🔑
# -------------------------------------------------------------

@app.route('/verify_username', methods=['POST'])
def verify_username():
    """
    Step 1 of password reset: Checks if the username exists in MongoDB.
    """
    data = request.json
    username = data.get('username')
    
    # Check if user data exists in MongoDB
    user_data = get_user_data_by_username(username)

    if user_data:
        # Success: Username found.
        return jsonify({"message": f"Username '{username}' verified."}), 200
    else:
        # Failure: Username not found.
        return jsonify({"error": "User not found. Please check your username."}), 404

@app.route('/reset_password', methods=['POST'])
def reset_password():
    """
    Step 2 of password reset: Saves the new hashed password to MongoDB.
    """
    data = request.json
    username = data.get('username')
    new_password = data.get('new_password')
    
    if not new_password or len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters."}), 400

    # Call the MongoDB update function
    success = update_password(username, new_password)
    
    if success:
        return jsonify({"message": "Password successfully reset. Please log in."}), 200
    else:
        # Failure means user not found or a database error
        return jsonify({"error": "Failed to reset password. User may not exist."}), 500

# -------------------------------------------------------------
# --- AUTHENTICATION/API HELPER FUNCTIONS (Updated to use MongoDB) ---
# -------------------------------------------------------------

def authenticate_request():
    """Validates the Bearer token against MongoDB."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, jsonify({"error": "Authorization token required."}), 401
    
    session_token = auth_header.split(' ')[1] 
    
    # Use MongoDB function to find user by token
    username = get_user_by_token(session_token)

    if not username:
        return None, jsonify({"error": "Invalid or expired session token."}), 401
    
    return username, None, None # Success returns username and two None error placeholders

@app.route('/upload', methods=['POST'])
def upload_file():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        filename = secure_filename(f"{username}_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        try:
            df = pd.read_csv(file_path)
            # The service function handles MongoDB insertion
            upload_timesheet_to_db(df) 
            
            os.remove(file_path) 
            
            return jsonify({"message": "File uploaded and processed successfully."}), 200
        except Exception as e:
            logging.error(f"Error processing CSV file for {username}: {e}")
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": f"Error processing file: {str(e)}"}), 500

    return jsonify({"error": "File upload failed due to unknown error."}), 500


@app.route('/chat', methods=['POST'])
def chat():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code
    
    data = request.json
    user_query = data.get('query')
    
    if not user_query:
        return jsonify({"error": "Query is required."}), 400

    try:
        llm_answer = get_llm_response(user_query)
        
        chat_history.setdefault(username, []).append({'sender': 'user', 'text': user_query})
        chat_history.setdefault(username, []).append({'sender': 'bot', 'text': llm_answer})
        
        return jsonify({"answer": llm_answer}), 200
    except Exception as e:
        return jsonify({"error": f"An internal server error occurred during chat: {str(e)}"}), 500


@app.route('/chat_history', methods=['GET'])
def get_chat_history():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code
    
    history = chat_history.get(username, [])
    return jsonify({"history": history}), 200


@app.route('/signout', methods=['POST'])
def signout():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Signout successful."}), 200 # Treat as successful if no token provided

    session_token = auth_header.split(' ')[1] 
    username = get_user_by_token(session_token)
    
    if username:
        # Invalidate the token in MongoDB (by setting it to None)
        # We use uuid4() to generate a unique, dummy password just for the update call
        # which clears the session token in the DB.
        update_password(username, str(uuid4())) 
        
    return jsonify({"message": "Signout successful."}), 200


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
