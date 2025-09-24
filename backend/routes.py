from flask import Blueprint, request, jsonify
import pandas as pd
from .llm_service import get_llm_response, get_timesheet_data_from_db, upload_timesheet_to_db

review_timesheet_bp = Blueprint('review_timesheet', __name__)

@review_timesheet_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        try:
            df = pd.read_csv(file)
            upload_timesheet_to_db(df)
            return jsonify({"message": "File uploaded and data stored successfully."})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@review_timesheet_bp.route('/review', methods=['POST'])
def review():
    user_query = request.json.get('query')
    if not user_query:
        return jsonify({"error": "No query provided"}), 400
    
    timesheet_data = get_timesheet_data_from_db()
    if timesheet_data.empty:
        return jsonify({"answer": "I’m sorry, but the timesheet data is empty. Please upload a file first."})
    
    summary_text = "Here's a summary of the timesheet data:\n" + timesheet_data.to_string()
    
    llm_answer = get_llm_response(user_query, summary_text)
    
    return jsonify({"answer": llm_answer})