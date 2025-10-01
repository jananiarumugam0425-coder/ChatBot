import pandas as pd
import pymongo
from openai import OpenAI
import os
import logging
from bcrypt import hashpw, gensalt, checkpw 
from uuid import uuid4
from datetime import datetime

logging.basicConfig(level=logging.INFO)

# --- CONFIGURATION ---
MONGO_URI = "mongodb://localhost:27017/" 
# CRITICAL: Database name confirmed as 'data_analysis_app_db'
MONGO_DATABASE_NAME = "data_analysis_app_db" 

# Placeholder for OpenRouter key (replace with actual key or env var)
OPENROUTER_API_KEY = "YOUR_API_Key" 

client_openai = OpenAI(
    base_url="https://openrouter.ai/api/v1", 
    api_key=OPENROUTER_API_KEY,
)

# --- DATABASE UTILITIES ---

def get_mongo_client():
    """Returns a MongoClient instance with timeout handling."""
    return pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

def get_users_collection(client):
    """Helper to get the 'users' collection for authentication."""
    db = client[MONGO_DATABASE_NAME] 
    # CRITICAL: Ensures unique index on username for quick checks
    db['users'].create_index([('username', pymongo.ASCENDING)], unique=True)
    return db['users']

def get_chats_collection(client):
    """Helper to get the 'chat_sessions' collection."""
    db = client[MONGO_DATABASE_NAME]
    # Create indexes for better performance
    db['chat_sessions'].create_index([('username', pymongo.ASCENDING)])
    db['chat_sessions'].create_index([('chat_id', pymongo.ASCENDING)], unique=True)
    return db['chat_sessions']

# --- MONGODB AUTHENTICATION FUNCTIONS ---

def create_user(username, password, full_name, email, phone_number, country):
    """
    Creates a new user, hashes the password, and stores all user details in MongoDB.
    Returns True on success, False if user already exists.
    """
    temp_client = None
    try:
        temp_client = get_mongo_client()
        users_collection = get_users_collection(temp_client)

        # 1. Check if user already exists
        if users_collection.find_one({'username': username}):
            return False 

        # 2. Hash the password securely
        hashed_password = hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')

        # 3. Store all required fields
        users_collection.insert_one({
            'username': username,
            'password_hash': hashed_password,
            'full_name': full_name,
            'email': email,
            'phone_number': phone_number,
            'country': country,
            'session_token': None # Always None at signup
        })
        logging.info(f"User {username} created successfully.")
        return True
    
    except Exception as e:
        logging.error(f"Database error during user creation: {e}")
        return False
    finally:
        if temp_client:
            temp_client.close()

def verify_user(username, password):
    """
    Verifies user credentials.
    Returns a new session token and username on success, or (None, None) on failure.
    """
    temp_client = None
    try:
        temp_client = get_mongo_client()
        users_collection = get_users_collection(temp_client)

        user_doc = users_collection.find_one({'username': username})
        
        if not user_doc:
            return None, None # User not found

        stored_hash = user_doc['password_hash'].encode('utf-8')
        
        if checkpw(password.encode('utf-8'), stored_hash):
            # Generate and save new session token on successful login
            session_token = str(uuid4())
            users_collection.update_one(
                {'username': username},
                {'$set': {'session_token': session_token}}
            )
            logging.info(f"User {username} logged in with new token.")
            return session_token, username
        else:
            return None, None # Password mismatch

    except Exception as e:
        logging.error(f"Error during user verification: {e}")
        return None, None 
    finally:
        if temp_client:
            temp_client.close()

def get_user_by_token(session_token):
    """Retrieves user data by session token."""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        users_collection = get_users_collection(temp_client)
        
        user_doc = users_collection.find_one({'session_token': session_token})
        
        if user_doc:
            # We only need the username for authentication checks
            return user_doc.get('username')
        return None
    except Exception as e:
        logging.error(f"Error retrieving user by token: {e}")
        return None 
    finally:
        if temp_client:
            temp_client.close()
            
def get_user_data_by_username(username):
    """Retrieves all user data by username."""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        users_collection = get_users_collection(temp_client)
        
        user_doc = users_collection.find_one({'username': username})
        
        if user_doc:
            # Remove the MongoDB _id before returning
            user_doc.pop('_id', None)
            # Remove the password hash for security
            user_doc.pop('password_hash', None) 
            return user_doc
        return None
    except Exception as e:
        logging.error(f"Error retrieving user data by username: {e}")
        return None 
    finally:
        if temp_client:
            temp_client.close()

def update_password(username, new_password):
    """Updates the user's password hash and invalidates the current session token."""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        users_collection = get_users_collection(temp_client)

        # Check if user exists before attempting update
        if not users_collection.find_one({'username': username}):
            return False 

        # Generate new hash
        new_hashed_password = hashpw(new_password.encode('utf-8'), gensalt()).decode('utf-8')
        
        # Update password hash and clear session token
        users_collection.update_one(
            {'username': username},
            {'$set': {
                'password_hash': new_hashed_password,
                'session_token': None # Invalidate token
            }}
        )
        logging.info(f"Password reset successful for {username}.")
        return True
    
    except Exception as e:
        logging.error(f"Database error during password update: {e}")
        return False
    finally:
        if temp_client:
            temp_client.close()

# --- CHAT HISTORY FUNCTIONS ---

def create_chat_session(username, session_name=None):
    """Creates a new chat session and returns the chat_id"""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        chats_collection = get_chats_collection(temp_client)
        
        chat_id = str(uuid4())
        session_name = session_name or f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        chat_session = {
            'chat_id': chat_id,
            'username': username,
            'session_name': session_name,
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'messages': []
        }
        
        chats_collection.insert_one(chat_session)
        logging.info(f"Created new chat session {chat_id} for user {username}")
        return chat_id
        
    except Exception as e:
        logging.error(f"Error creating chat session: {e}")
        return None
    finally:
        if temp_client:
            temp_client.close()

def add_message_to_chat(chat_id, sender, text):
    """Adds a message to an existing chat session"""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        chats_collection = get_chats_collection(temp_client)
        
        message = {
            'message_id': str(uuid4()),
            'sender': sender,
            'text': text,
            'timestamp': datetime.now()
        }
        
        chats_collection.update_one(
            {'chat_id': chat_id},
            {
                '$push': {'messages': message},
                '$set': {'updated_at': datetime.now()}
            }
        )
        return True
        
    except Exception as e:
        logging.error(f"Error adding message to chat: {e}")
        return False
    finally:
        if temp_client:
            temp_client.close()

def get_user_chat_sessions(username):
    """Gets all chat sessions for a user"""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        chats_collection = get_chats_collection(temp_client)
        
        sessions = list(chats_collection.find(
            {'username': username},
            {'messages': 0}  # Exclude messages for listing
        ).sort('updated_at', -1))
        
        # Convert ObjectId to string and format dates for JSON serialization
        for session in sessions:
            session['_id'] = str(session['_id'])
            session['created_at'] = session['created_at'].isoformat()
            session['updated_at'] = session['updated_at'].isoformat()
            
        return sessions
        
    except Exception as e:
        logging.error(f"Error getting user chat sessions: {e}")
        return []
    finally:
        if temp_client:
            temp_client.close()

def get_chat_messages(chat_id, username):
    """Gets all messages for a specific chat session"""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        chats_collection = get_chats_collection(temp_client)
        
        chat = chats_collection.find_one({
            'chat_id': chat_id,
            'username': username  # Security: user can only access their own chats
        })
        
        if chat:
            # Format messages for frontend
            messages = []
            for msg in chat.get('messages', []):
                messages.append({
                    'sender': msg['sender'],
                    'text': msg['text'],
                    'timestamp': msg['timestamp'].isoformat()
                })
            return messages
        return None  # Return None instead of empty list for non-existent sessions
        
    except Exception as e:
        logging.error(f"Error getting chat messages: {e}")
        return None
    finally:
        if temp_client:
            temp_client.close()

def validate_chat_session(chat_id, username):
    """Validates if a chat session exists and belongs to the user"""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        chats_collection = get_chats_collection(temp_client)
        
        chat = chats_collection.find_one({
            'chat_id': chat_id,
            'username': username
        })
        
        if chat:
            return {
                'valid': True,
                'chat_id': chat_id,
                'session_name': chat.get('session_name', 'Unknown Session'),
                'username': username
            }
        else:
            return {
                'valid': False,
                'error': 'Chat session not found or access denied'
            }
            
    except Exception as e:
        logging.error(f"Error validating chat session: {e}")
        return {
            'valid': False,
            'error': f'Error validating chat session: {str(e)}'
        }
    finally:
        if temp_client:
            temp_client.close()

def delete_chat_session(chat_id, username):
    """Deletes a chat session"""
    temp_client = None
    try:
        temp_client = get_mongo_client()
        chats_collection = get_chats_collection(temp_client)
        
        result = chats_collection.delete_one({
            'chat_id': chat_id,
            'username': username
        })
        
        return result.deleted_count > 0
        
    except Exception as e:
        logging.error(f"Error deleting chat session: {e}")
        return False
    finally:
        if temp_client:
            temp_client.close()

# --- TIMESHEET DATA FUNCTIONS ---

def summarize_timesheet_data(df):
    if df.empty:
        return "The timesheet data is currently empty."
    summary = df.head(10).to_csv(index=False)
    columns = ", ".join(df.columns)
    return f"Timesheet columns: {columns}\n\nFirst 10 rows of timesheet data:\n{summary}"

def upload_timesheet_to_db(df):
    temp_client = None
    try:
        temp_client = get_mongo_client()
        temp_db = temp_client[MONGO_DATABASE_NAME]
        temp_collection = temp_db['timesheets']
        
        temp_collection.delete_many({})
        records = df.to_dict('records')
        temp_collection.insert_many(records)
        logging.info(f"Uploaded {len(records)} records.")
        return True
    except Exception as e:
        logging.error(f"FATAL: Database operation failed during upload: {e}")
        raise RuntimeError(f"Database upload failed. Error: {e}") 
    finally:
        if temp_client:
            temp_client.close()

def get_timesheet_data_from_db():
    temp_client = None
    try:
        temp_client = get_mongo_client()
        temp_db = temp_client[MONGO_DATABASE_NAME]
        temp_collection = temp_db['timesheets']

        records = list(temp_collection.find({}))
        
        if not records:
            return pd.DataFrame()
        
        df = pd.DataFrame(records)
        if '_id' in df.columns:
            df = df.drop(columns=['_id'])
        return df

    except Exception as e:
        logging.error(f"Error during MongoDB retrieval: {e}")
        return pd.DataFrame() 
    finally:
        if temp_client:
            temp_client.close()

# --- LLM FUNCTION ---

def get_llm_response(user_query):
    try:
        df_data = get_timesheet_data_from_db()
        data_summary = summarize_timesheet_data(df_data)

        if "data is currently empty" in data_summary:
            return "I'm sorry, I don't have any timesheet data to analyze. Please upload a timesheet file first."
            
        prompt = f"""
You are a specialized Timesheet Data Analyst Bot. Your function is strictly limited to reviewing the provided timesheet data. 
The data is provided below. Do NOT hallucinate data. If the answer requires calculation, show the summary calculation steps.

--- TIMESHEET DATA ---
{data_summary}
--- END DATA ---

User Query: {user_query}
"""
        response = client_openai.chat.completions.create(
            extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "Timesheet Reviewer Bot"},
            model="openai/gpt-4o",
            messages=[
                {"role": "system", "content": "You are a specialized Timesheet Data Analyst Bot. Analyze the provided timesheet data and answer the user's questions truthfully based *only* on the data. Be polite and concise."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,  
            stream=False
        )

        return response.choices[0].message.content

    except Exception as e:
        logging.error(f"An error occurred while getting LLM response: {e}")
        return "An unexpected error occurred while contacting the AI service. Please try again later."