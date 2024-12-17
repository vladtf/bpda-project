from flask import Flask, jsonify
from flask_cors import CORS
from uuid import uuid4
from flask import request

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


# In-memory mock data
voters = {}
elections = {}
candidates = {}
votes = {}
signatures = {}
disputes = {}

# Example structure:
# elections[electionId] = {
#   "name": "...",
#   "description": "...",
#   "start_time": "...",
#   "end_time": "...",
#   "threshold": N,
#   "status": "ongoing" or "ended",
#   "admin": "some_admin_addr"
# }
#
# candidates[(electionId, candidateId)] = {
#   "name": "...",
#   "manifesto": "...",
#   "fee_paid": True/False,
#   "sign_count": integer,
#   "approved": True/False,
#   "votes": [ { "voter": "address", "rating": X }, ...]
# }
#
# voters["address"] = { "eligible": True/False, "token": "..." }


@app.route('/eligibility_check', methods=['POST'])
def eligibility_check():
    # Input: { "id_info": { ... } }
    data = request.get_json()
    # Simulate checking eligibility
    # For this mock, we just say everyone is eligible if data present
    if data and "id_info" in data:
        voter_address = f"erd_{uuid4().hex[:8]}"
        voters[voter_address] = {"eligible": True, "token": "soulbound_token_example"}
        return jsonify({
            "eligible": True,
            "voter_address": voter_address,
            "token": "soulbound_token_example"
        }), 200
    else:
        return jsonify({"eligible": False}), 400


@app.route('/register_election', methods=['POST'])
def register_election():
    # Input: {
    #   "name": "...",
    #   "description": "...",
    #   "start_time": "...",
    #   "end_time": "...",
    #   "threshold": N,
    #   "admin": "address_of_admin",
    #   "fee": "some_value"
    # }
    data = request.get_json()
    if not data or "admin" not in data:
        return jsonify({"error": "Invalid election data"}), 400

    electionId = f"election_{uuid4().hex[:6]}"
    elections[electionId] = {
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "start_time": data.get("start_time", ""),
        "end_time": data.get("end_time", ""),
        "threshold": data.get("threshold", 10),
        "admin": data["admin"],
        "status": "ongoing"
    }
    return jsonify({"electionId": electionId}), 200


@app.route('/register_candidate', methods=['POST'])
def register_candidate():
    # Input: {
    #   "electionId": "...",
    #   "name": "...",
    #   "manifesto": "...",
    #   "fee": "some_value"
    # }
    data = request.get_json()
    electionId = data.get("electionId")
    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    candidateId = f"cand_{uuid4().hex[:6]}"
    candidates[(electionId, candidateId)] = {
        "name": data.get("name"),
        "manifesto": data.get("manifesto"),
        "fee_paid": True,
        "sign_count": 0,
        "approved": False,
        "votes": []
    }
    return jsonify({
        "candidateId": candidateId,
        "status": "Pending"
    }), 200


@app.route('/sign_candidate', methods=['POST'])
def sign_candidate():
    # Input: {
    #   "voter_address": "...",
    #   "electionId": "...",
    #   "candidateId": "..."
    # }
    data = request.get_json()
    voter_address = data.get("voter_address")
    electionId = data.get("electionId")
    candidateId = data.get("candidateId")

    if voter_address not in voters or not voters[voter_address]["eligible"]:
        return jsonify({"error": "Voter not eligible"}), 403

    if (electionId, candidateId) not in candidates:
        return jsonify({"error": "Invalid candidate"}), 404

    # Check if already signed
    sig_key = (voter_address, electionId, candidateId)
    if sig_key in signatures:
        return jsonify({"error": "Already signed"}), 400

    signatures[sig_key] = True
    candidates[(electionId, candidateId)]["sign_count"] += 1

    # Check if threshold reached
    if candidates[(electionId, candidateId)]["sign_count"] >= elections[electionId]["threshold"]:
        candidates[(electionId, candidateId)]["approved"] = True

    return jsonify({"sign_count": candidates[(electionId, candidateId)]["sign_count"], 
                    "approved": candidates[(electionId, candidateId)]["approved"]}), 200


@app.route('/vote', methods=['POST'])
def vote():
    # Input: {
    #   "voter_address": "...",
    #   "electionId": "...",
    #   "votes": [
    #       { "candidateId": "...", "rating": X },
    #       { "candidateId": "...", "rating": Y }
    #   ]
    # }
    data = request.get_json()
    voter_address = data.get("voter_address")
    electionId = data.get("electionId")
    votes_input = data.get("votes", [])

    if voter_address not in voters or not voters[voter_address]["eligible"]:
        return jsonify({"error": "Voter not eligible"}), 403

    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    # Record votes
    for v_obj in votes_input:
        candidateId = v_obj["candidateId"]
        rating = v_obj["rating"]
        if (electionId, candidateId) not in candidates:
            continue
        # Prevent double voting for the same candidate by the same voter
        existing_votes = candidates[(electionId, candidateId)]["votes"]
        if any(ev["voter"] == voter_address for ev in existing_votes):
            # Already voted this candidate
            continue
        candidates[(electionId, candidateId)]["votes"].append({"voter": voter_address, "rating": rating})

    return jsonify({"status": "Votes recorded"}), 200


@app.route('/end_election', methods=['POST'])
def end_election():
    # Input: { "electionId": "..." }
    data = request.get_json()
    electionId = data.get("electionId")
    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    elections[electionId]["status"] = "ended"
    return jsonify({"status": "Election ended"}), 200


@app.route('/results', methods=['GET'])
def results():
    # Inputs via query params: ?electionId=...
    electionId = request.args.get("electionId")
    if not electionId or electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    # Compute tallies from candidate votes
    tally = []
    for (eId, cId), cData in candidates.items():
        if eId == electionId:
            total_rating = sum(v["rating"] for v in cData["votes"])
            tally.append({
                "candidateId": cId,
                "name": cData["name"],
                "manifesto": cData["manifesto"],
                "approved": cData["approved"],
                "total_rating": total_rating,
                "vote_count": len(cData["votes"])
            })

    # Sort by total_rating descending
    tally.sort(key=lambda x: x["total_rating"], reverse=True)
    return jsonify({"results": tally}), 200


@app.route('/dispute', methods=['POST'])
def dispute():
    # Input: { "electionId": "...", "reason": "...", ...}
    data = request.get_json()
    electionId = data.get("electionId")
    reason = data.get("reason")

    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    disputeId = f"disp_{uuid4().hex[:6]}"
    disputes[disputeId] = {
        "electionId": electionId,
        "reason": reason,
        "resolved": False,
        "result_adjusted": False
    }

    return jsonify({"disputeId": disputeId, "status": "received"}), 200


@app.route('/resolve_dispute', methods=['POST'])
def resolve_dispute():
    # Input: { "disputeId": "...", "valid": True/False }
    data = request.get_json()
    disputeId = data.get("disputeId")
    valid = data.get("valid", False)

    if disputeId not in disputes:
        return jsonify({"error": "Invalid disputeId"}), 404

    disputes[disputeId]["resolved"] = True
    if valid:
        # In a real scenario, adjust results accordingly
        disputes[disputeId]["result_adjusted"] = True

    return jsonify({
        "disputeId": disputeId,
        "resolved": True,
        "result_adjusted": disputes[disputeId]["result_adjusted"]
    }), 200


if __name__ == '__main__':
    # Run the Flask app on http://127.0.0.1:5000
    app.run(debug=True, host='0.0.0.0', port=5000)
