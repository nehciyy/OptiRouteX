from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import logging

app = Flask(__name__)
CORS(app)

tasks = {}
task_data = {}

logging.basicConfig(level=logging.INFO)

@app.route('/calculate-route', methods=['POST'])
def calculate_route():
    data = request.get_json()
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing"}
    task_data[task_id] = data

    logging.info(f"Task {task_id} started processing with data: {data}")
    return jsonify({"task_id": task_id}), 202

@app.route('/get-results/<task_id>', methods=['GET'])
def get_results(task_id):
    task = tasks.get(task_id)
    if task:
        if task['status'] == 'complete':
            return jsonify(task)
        else:
            return jsonify({"status": "processing"}), 202
    else:
        return jsonify({"status": "error", "message": "Task not found"}), 404

@app.route('/receive-data/<task_id>', methods=['POST'])
def receive_data(task_id):
    if not task_id:
        return jsonify({"status": "error", "message": "Task ID is missing or invalid"}), 400

    data = request.json
    total_distance = data.get('total_distance')
    segment_distances = data.get('segment_distances')

    tasks[task_id] = {
        "status": "complete",
        "total_distance": total_distance,
        "segment_distances": segment_distances
    }

    logging.info(f"Task {task_id} completed with distance: {total_distance}")
    if task_id in task_data:
        del task_data[task_id]

    return jsonify({"status": "success", "message": "Data received successfully"}), 200

@app.route('/get-route-data', methods=['GET'])
def get_route_data():
    task_id = request.args.get('task_id')
    if not task_id:
        return jsonify({"status": "error", "message": "Task ID is required"}), 400

    if task_id in task_data:
        return jsonify(task_data[task_id])
    return jsonify({"status": "no_data"}), 404

if __name__ == '__main__':
    app.run(port=5000)
