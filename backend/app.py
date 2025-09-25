import uuid
import csv
import os
import logging
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime

# CRITICAL: Imports functions from llm_service.py
try:
    from backend.llm_service import upload_timesheet_to_db, get_timesheet_data_from_db, get_llm_response
except ImportError as e:
    # This logging line will show up if the file isn't found
    logging.error(f"FATAL: Failed to import llm_service.py. Check file location. Error: {e}")
    # Define placeholder functions that raise the error the user is seeing
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
    users_data = {}
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', newline='') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    users_data[row['username']] = {
                        'password': row.get('password'),
                        'session_token': row.get('session_token', None) 
                    }
        except Exception as e:
            logging.error(f"Error reading users file: {e}")
            return {} 
    return users_data

def save_users_to_file(users_data):
    fieldnames = ['username', 'password', 'session_token'] 
    final_data = []
    for username, data in users_data.items():
        row = data.copy() 
        row['username'] = username
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

users = load_users()

# --- AUTHENTICATION ROUTES ---

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    global users
    users = load_users() 

    user_data = users.get(username)

    if user_data and user_data.get('password') == password:
        session_token = str(uuid.uuid4())
        users[username]['session_token'] = session_token
        save_users_to_file(users)
        return jsonify({"message": "Login successful", "session_token": session_token}), 200
    else:
        return jsonify({"error": "Invalid username or password."}), 401

@app.route('/signup', methods=['POST'])
def signup():
    return jsonify({"error": "Signup route disabled for this example."}), 500

# --- CHAT & UPLOAD ROUTES (Protected) ---

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

    filepath = None
    if file:
        try:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            df = pd.read_csv(filepath) 
            
            # Call the robust MongoDB upload function
            upload_timesheet_to_db(df)
            
            if os.path.exists(filepath):
                 os.remove(filepath)
            
            bot_response = f"Thank you for uploading **{filename}**. The timesheet data has been successfully stored in MongoDB."
            
            if username not in chat_history:
                chat_history[username] = []
            
            chat_history[username].append({
                "sender": "bot",
                "text": bot_response,
                "timestamp": datetime.now().isoformat() 
            })
            
            return jsonify({"message": bot_response}), 200 

        except RuntimeError as e:
            # Catches database connection failure errors raised by the robust llm_service.py 
            # OR the placeholder error if llm_service failed to import.
            logging.error(f"Upload failed due to database runtime error: {e}")
            if filepath and os.path.exists(filepath): os.remove(filepath)
            return jsonify({"error": f"Upload failed. Database issue: {str(e)}"}), 500

        except Exception as e:
            # Catches file processing or pandas errors
            logging.error(f"Failed to process file: {str(e)}")
            if filepath and os.path.exists(filepath): os.remove(filepath)
            return jsonify({"error": f"File processing failed: {str(e)}"}), 500
    
    return jsonify({"error": "File upload failed due to unknown error."}), 500


@app.route('/chat', methods=['POST'])
def chat():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code

    try:
        data = request.json
        user_query = data.get('query')

        # Call the LLM response function directly (it handles data retrieval/checking)
        bot_answer = get_llm_response(user_query)
        
        if username not in chat_history:
            chat_history[username] = []
            
        chat_history[username].append({"sender": "user", "text": user_query, "timestamp": data.get('timestamp', datetime.now().isoformat())})
        chat_history[username].append({"sender": "bot", "text": bot_answer, "timestamp": datetime.now().isoformat()}) 

        return jsonify({"answer": bot_answer}), 200
    except Exception as e:
        logging.error(f"Chat route failed with unexpected error: {e}")
        return jsonify({"error": f"An internal server error occurred during chat: {str(e)}"}), 500


@app.route('/chat_history', methods=['GET'])
def get_chat_history():
    username, error_response, status_code = authenticate_request()
    if error_response:
        return error_response, status_code
    
    history = chat_history.get(username, [])
    return jsonify({"history": history}), 200

# --- MAIN EXECUTION ---

if __name__ == '__main__':
    if not os.path.exists(USERS_FILE):
        fieldnames = ['username', 'password', 'session_token'] 
        with open(USERS_FILE, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

    # FIX: Run directly using the python interpreter for better import stability
    app.run(debug=True, host='127.0.0.1', port=5000)