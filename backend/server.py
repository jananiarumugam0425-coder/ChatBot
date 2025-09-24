from flask import Flask, request, jsonify
from .routes import review_timesheet_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.register_blueprint(review_timesheet_bp)

if __name__ == '__main__':
    app.run(debug=True)