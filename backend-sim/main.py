from flask import Flask, jsonify
from flask_cors import CORS
from uuid import uuid4
from flask import request

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "https://localhost:3000"}})

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
    # Input: { "id_info": { ... }, "voter_address": "..." }
    data = request.get_json()
    voter_address = data.get("voter_address")
    # Simulate checking eligibility
    # For this mock, we just say everyone is eligible if data present
    if data and "id_info" in data and voter_address:
        voters[voter_address] = {"eligible": True, "token": "soulbound_token_example"}
        return jsonify({
            "eligible": True,
            "voter_address": voter_address,
            "token": "soulbound_token_example"
        }), 200
    else:
        return jsonify({"error": "Eligibility check failed"}), 400


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
    candidateName = data.get("name")

    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    # Check if candidate already registered
    if any(cdata["name"] == candidateName for (eid, cid), cdata in candidates.items() if eid == electionId):
        return jsonify({"error": "Candidate already registered"}), 400

    candidateId = f"cand_{uuid4().hex[:6]}"
    candidates[(electionId, candidateId)] = {
        "name": candidateName,
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
        if rating < 0 or rating > 10:
            return jsonify({"error": "Invalid rating value, must be between 0 and 10"}), 400
        if (electionId, candidateId) not in candidates:
            continue
        # Prevent double voting for the same candidate by the same voter
        existing_votes = candidates[(electionId, candidateId)]["votes"]
        if any(ev["voter"] == voter_address for ev in existing_votes):
            # Already voted this candidate
            continue
        candidates[(electionId, candidateId)]["votes"].append({"voter": voter_address, "rating": rating})

    # Compute intermediate results
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

    return jsonify({"status": "Votes recorded", "intermediate_results": tally}), 200


@app.route('/end_election', methods=['POST'])
def end_election():
    # Input: { "electionId": "...", "admin": "..." }
    data = request.get_json()
    electionId = data.get("electionId")
    admin = data.get("admin")

    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    if elections[electionId]["admin"] != admin:
        return jsonify({"error": "Unauthorized"}), 403

    elections[electionId]["status"] = "ended"

    # Count unresolved disputes
    unresolved_disputes = sum(1 for d in disputes.values() if d["electionId"] == electionId and not d["resolved"])

    return jsonify({"status": "Election ended", "unresolved_disputes": unresolved_disputes}), 200


@app.route('/results', methods=['GET'])
def results():
    # Inputs via query params: ?electionId=...
    electionId = request.args.get("electionId")
    if not electionId or electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    election = elections[electionId]

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

    winner = None
    if election["status"] == "ended" and tally:
        winner = {
            "candidateId": tally[0]["candidateId"],
            "name": tally[0]["name"],
            "total_rating": tally[0]["total_rating"]
        }

    return jsonify({
        "election": {
            "id": electionId,
            "name": election["name"],
            "description": election["description"],
            "start_time": election["start_time"],
            "end_time": election["end_time"],
            "status": election["status"]
        },
        "results": tally,
        "winner": winner
    }), 200


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


@app.route('/elections', methods=['GET'])
def get_elections():
    return jsonify({"elections": [
        {
            "id": eid,
            "name": edata["name"],
            "description": edata["description"],
            "start_time": edata["start_time"],
            "end_time": edata["end_time"],
            "threshold": edata["threshold"],
            "status": edata["status"],
            "admin": edata["admin"],
            "fee": edata.get("fee", 100)
        } for eid, edata in elections.items()
    ]}), 200
    
@app.route('/elections/<electionId>', methods=['GET'])
def get_election(electionId):
    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404
    
    # count number of unresolved_disputes
    unresolved_disputes = sum(1 for d in disputes.values() if d["electionId"] == electionId and not d["resolved"])

    return jsonify({
        "election": {
            "id": electionId,
            "name": elections[electionId]["name"],
            "description": elections[electionId]["description"],
            "start_time": elections[electionId]["start_time"],
            "end_time": elections[electionId]["end_time"],
            "threshold": elections[electionId]["threshold"],
            "status": elections[electionId]["status"],
            "admin": elections[electionId]["admin"],
            "fee": elections[electionId].get("fee", 100),
            "unresolved_disputes": unresolved_disputes
        }
    }), 200

@app.route('/candidates', methods=['GET'])
def get_candidates():
    electionId = request.args.get("electionId")

    # Return all candidates if no electionId specified
    if not electionId:
        return jsonify({"candidates": [
            {
                "id": cid,
                "electionId": eid,
                "name": cdata["name"],
                "manifesto": cdata["manifesto"],
                "sign_count": cdata["sign_count"],
                "approved": cdata["approved"]
            } for (eid, cid), cdata in candidates.items()
        ]}), 200

    if electionId not in elections:
        return jsonify({"error": "Invalid electionId"}), 404

    return jsonify({"candidates": [
        {
            "id": cid,
            "name": cdata["name"],
            "manifesto": cdata["manifesto"],
            "sign_count": cdata["sign_count"],
            "approved": cdata["approved"]
        } for (eid, cid), cdata in candidates.items() if eid == electionId
    ]}), 200


@app.route('/validate_candidate', methods=['POST'])
def validate_candidate():
    # Input: { "electionId": "...", "candidateId": "..." }
    data = request.get_json()
    electionId = data.get("electionId")
    candidateId = data.get("candidateId")

    if (electionId, candidateId) not in candidates:
        return jsonify({"error": "Invalid candidate"}), 404

    candidate = candidates[(electionId, candidateId)]
    if candidate["sign_count"] >= elections[electionId]["threshold"]:
        candidate["approved"] = True
        return jsonify({"status": "Candidate validated", "approved": True, "sign_count": candidate["sign_count"]}), 200
    else:
        return jsonify({"error": "Not enough signatures", "approved": False, "sign_count": candidate["sign_count"]}), 400


@app.route('/voters', methods=['GET'])
def get_voters():
    return jsonify({"voters": [
        {
            "address": addr,
            "eligible": vdata["eligible"],
            "token": vdata["token"]
        } for addr, vdata in voters.items()
    ]}), 200

@app.route('/disputes', methods=['GET'])
def get_disputes():
    return jsonify({"disputes": [
        {
            "id": did,
            "electionId": ddata["electionId"],
            "reason": ddata["reason"],
            "resolved": ddata["resolved"],
            "result_adjusted": ddata["result_adjusted"]
        } for did, ddata in disputes.items()
    ]}), 200


def register_default_items():
    # Register a default election
    electionId = "election_default"
    elections[electionId] = {
        "name": "Default Election",
        "description": "This is a default election for testing.",
        "start_time": "2023-01-01T00:00:00Z",
        "end_time": "2023-12-31T23:59:59Z",
        "threshold": 1,
        "admin": "erd1rz6603qr57vumjpwvvk8l777uw945xxq432a7ae8pysemgmqrtcq0yvvr5",
        "status": "ongoing"
    }

    # Register a default candidate
    candidateId = "cand_default"
    candidates[(electionId, candidateId)] = {
        "name": "Default Candidate",
        "manifesto": "This is a default candidate for testing.",
        "fee_paid": True,
        "sign_count": 0,
        "approved": False,
        "votes": []
    }

    # Register a default voter
    voter_address = "voter_default"
    voters[voter_address] = {"eligible": True, "token": "soulbound_token_example"}

    # Register a default dispute
    disputeId = "disp_default"
    disputes[disputeId] = {
        "electionId": electionId,
        "reason": "Default dispute reason.",
        "resolved": False,
        "result_adjusted": False
    }


if __name__ == '__main__':
    # Uncomment the line below to enable default items registration for testing
    register_default_items()
    # Run the Flask app on http://127.0.0.1:5000
    app.run(debug=True, host='0.0.0.0', port=5000)
