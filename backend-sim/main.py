from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "https://localhost:3000"}})

@app.route('/ping-pong/abi/time-to-pong', methods=['OPTIONS', 'GET'])
def time_to_pong():
    # Return the fixed JSON response
    return jsonify({"status": "not_yet_pinged"}), 200

@app.route('/account', methods=['OPTIONS', 'GET'])
def account():
    # Return the fixed JSON response
    return jsonify({
        "address": "erd1rz6603qr57vumjpwvvk8l777uw945xxq432a7ae8pysemgmqrtcq0yvvr5",
        "balance": "26198263171619999970",
        "nonce": 366,
        "shard": 0
    }), 200

@app.route('/ping-pong/abi/ping', methods=['POST'])
def ping():
    # Return the fixed JSON response
    return jsonify({
        "nonce": 366,
        "value": "1000000000000000000",
        "receiver": "erd1qqqqqqqqqqqqqpgqm6ad6xrsjvxlcdcffqe8w58trpec09ug9l5qde96pq",
        "sender": "erd1rz6603qr57vumjpwvvk8l777uw945xxq432a7ae8pysemgmqrtcq0yvvr5",
        "gasPrice": 1000000000,
        "gasLimit": 6000000,
        "data": "cGluZw==",
        "chainID": "D",
        "version": 1
    }), 200

@app.route('/ping-pong/abi/pong', methods=['POST'])
def pong():
    # Return the fixed JSON response
    return jsonify({
        "nonce": 367,
        "value": "0",
        "receiver": "erd1qqqqqqqqqqqqqpgqm6ad6xrsjvxlcdcffqe8w58trpec09ug9l5qde96pq",
        "sender": "erd1rz6603qr57vumjpwvvk8l777uw945xxq432a7ae8pysemgmqrtcq0yvvr5",
        "gasPrice": 1000000000,
        "gasLimit": 6000000,
        "data": "cG9uZw==",
        "chainID": "D",
        "version": 1
    }), 200

if __name__ == '__main__':
    # Run the Flask app on http://127.0.0.1:5000
    app.run(debug=True, host='0.0.0.0', port=5000)
