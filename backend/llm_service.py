import pandas as pd
import pymongo
from openai import OpenAI
import os
import logging
from bcrypt import hashpw, gensalt, checkpw 
from uuid import uuid4

logging.basicConfig(level=logging.INFO)

# --- CONFIGURATION ---
MONGO_URI = "mongodb://localhost:27017/" 
# CRITICAL: Database name confirmed as 'data_analysis_app_db'
MONGO_DATABASE_NAME = "data_analysis_app_db" 

# Placeholder for OpenRouter key (replace with actual key or env var)
OPENROUTER_API_KEY = "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" 

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

# --- TIMESHEET DATA FUNCTIONS (Unchanged, but included for completeness) ---

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

# --- LLM FUNCTION (Unchanged) ---

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
