import pymongo
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = pymongo.MongoClient(MONGO_URI)
db = client['timesheet_bot']
collection = db['timesheets']

def upload_timesheet_to_db(df):
    """Uploads a pandas DataFrame to the MongoDB collection."""
    collection.delete_many({}) # Clears previous data
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