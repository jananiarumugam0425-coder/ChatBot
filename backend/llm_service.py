from openai import OpenAI
import os
import pandas as pd
import pymongo

# Replace with your actual MongoDB URI from Atlas
MONGO_URI = "use your uri"
client_mongo = pymongo.MongoClient(MONGO_URI)
db = client_mongo['timesheet_bot']
collection = db['timesheets']

# Replace with your actual OpenRouter API key
OPENROUTER_API_KEY = "YOUR_API_KEY"

# Create a single OpenAI client instance
client_openai = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

def upload_timesheet_to_db(df):
    """Uploads a pandas DataFrame to the MongoDB collection."""
    collection.delete_many({})
    records = df.to_dict('records')
    collection.insert_many(records)

def get_timesheet_data_from_db():
    """Retrieves all documents from the MongoDB collection and returns a DataFrame."""
    records = list(collection.find({}))
    if not records:
        return pd.DataFrame()
    
    df = pd.DataFrame(records)
    if '_id' in df.columns:
        df = df.drop(columns=['_id'])
    return df

def get_llm_response(user_query, summary_text):
    """
    Sends a combined query and timesheet summary to the OpenRouter API and returns the response.
    """
    try:
        prompt = f"""
Here is the timesheet data:
{summary_text}

User Query: {user_query}
"""
        response = client_openai.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Timesheet Reviewer Bot",
            },
            model="deepseek/deepseek-chat-v3.1:free",
            messages=[
                {"role": "system", "content": "You are a specialized Timesheet Data Analyst Bot. Your function is strictly limited to reviewing the provided timesheet data. For any question that falls outside the scope of the timesheet, you will politely decline and state, 'My expertise is limited to timesheet data. Please ask me a question about the timesheet.'"},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )

        llm_answer = response.choices[0].message.content
        return llm_answer

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return "An unexpected error occurred. Please try again later."