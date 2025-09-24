import pandas as pd

def get_timesheet_data():
    """
    Reads timesheet data from a CSV file using an absolute path.
    Returns a pandas DataFrame.
    """
    # Use the absolute path provided
    file_path = 'E:/Employee Timesheet chatbot/backend/data/timesheet.csv'

    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"Error: The timesheet file was not found at {file_path}")
        return pd.DataFrame()