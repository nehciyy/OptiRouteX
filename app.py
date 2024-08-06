from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')

if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

@app.route('/save-json', methods=['POST'])
def save_json():
    data = request.get_json()
    file_name = data.get('fileName')
    file_data = data.get('data')

    if not file_name or not file_data:
        return jsonify({'error': 'Invalid input'}), 400

    file_path = os.path.join(MODELS_DIR, f'{file_name}.json')

    try:
        with open(file_path, 'w') as json_file:
            json.dump(file_data, json_file, indent=2)
        return jsonify({'message': 'File saved successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
