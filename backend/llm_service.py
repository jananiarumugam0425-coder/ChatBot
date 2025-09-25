import pandas as pd
import pymongo
from openai import OpenAI
import os
import logging

logging.basicConfig(level=logging.INFO)

# --- CONFIGURATION ---
MONGO_URI = "mongodb://localhost:27017/" 

# CRITICAL: Replace with your actual OpenRouter key
OPENROUTER_API_KEY = "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" 

# Create a single OpenAI client instance
client_openai = OpenAI(
    # FIX: Correct Base URL for OpenRouter
    base_url="https://openrouter.ai/api/v1", 
    api_key=OPENROUTER_API_KEY,
)

# --- UTILITY FUNCTIONS ---

def summarize_timesheet_data(df):
    """Generates a text summary of the DataFrame structure for the LLM."""
    if df.empty:
        return "The timesheet data is currently empty."
    
    # We only summarize the columns and a few rows to save input tokens
    summary = df.head(10).to_csv(index=False)
    columns = ", ".join(df.columns)
    
    return f"Timesheet columns: {columns}\n\nFirst 10 rows of timesheet data:\n{summary}"


def upload_timesheet_to_db(df):
    """
    Uploads a pandas DataFrame to MongoDB using a fresh connection for transactional safety.
    """
    temp_client = None
    try:
        # Create a fresh connection for this operation
        temp_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        temp_db = temp_client['timesheet_bot']
        temp_collection = temp_db['timesheets']
        
        # Delete old data and insert new data
        temp_collection.delete_many({})
        records = df.to_dict('records')
        temp_collection.insert_many(records)
        logging.info(f"Uploaded {len(records)} records using fresh connection.")
        
        return True
    except Exception as e:
        logging.error(f"FATAL: Database operation failed during upload: {e}")
        # Raise RuntimeError for app.py to catch and send a clean error message
        raise RuntimeError(f"Database upload failed. Check MongoDB status. Error: {e}") 
    finally:
        # Ensure the connection is always closed
        if temp_client:
            temp_client.close()


def get_timesheet_data_from_db():
    """
    Retrieves all documents from the MongoDB collection using a fresh connection.
    """
    temp_client = None
    try:
        # Create a fresh connection for this operation
        temp_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        temp_db = temp_client['timesheet_bot']
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
        # Ensure the connection is always closed
        if temp_client:
            temp_client.close()


def get_llm_response(user_query):
    """Sends query and timesheet data (retrieved internally) to the OpenRouter API."""
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
            # FIX: Explicitly limit output tokens to avoid 402 error on free tier
            max_tokens=500,  
            stream=False
        )

        return response.choices[0].message.content

    except Exception as e:
        logging.error(f"An error occurred while getting LLM response: {e}")
        return "An unexpected error occurred while contacting the AI service. Please try again later."