from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, messaging
import time
from typing import Optional


app = Flask(__name__)
CORS(app)

# Mock data
users = [
    # amazonq-ignore-next-line
    {"id": "1", "username": "dbs", "password": "dbs123", "role": "DBS_OPERATOR", "name": "DBS Operator"},
    # amazonq-ignore-next-line
    # amazonq-ignore-next-line
    {"id": "2", "username": "eic", "password": "password", "role": "EIC", "name": "EIC Admin"},
    # amazonq-ignore-next-line
    {"id": "3", "username": "ms", "password": "ms123", "role": "MS_OPERATOR", "name": "MS Operator"},
    # amazonq-ignore-next-line
    {"id": "4", "username": "driver", "password": "driver123", "role": "SGL_DRIVER", "name": "SGL Driver"},
    # amazonq-ignore-next-line
    {"id": "7", "username": "newdriver", "password": "driver123", "role": "DRIVER", "name": "New Driver"},
    # amazonq-ignore-next-line
    {"id": "5", "username": "fdodo", "password": "fdodo123", "role": "FDODO_CUSTOMER", "name": "FDODO Customer"},
    # amazonq-ignore-next-line
    {"id": "6", "username": "sgl", "password": "sgl123", "role": "SGL_CUSTOMER", "name": "SGL Customer"},
]

#
# EIC sample data (kept in-memory for local development)
#

# Simple permission store keyed by user ID
eic_permissions = {
    "2": {
        "canApproveProposals": True,
        "canTriggerCorrectiveActions": True,
        "canManageDrivers": True,
        "canManageClusters": True,
    },
}

# Demo stock requests (mirrors src/api/eicMock.js)
eic_stock_requests = [
    {
        "id": "REQ-001",
        "type": "FDODO",
        "requesterId": "FDODO-001",
        "requesterName": "Reliance Industries Ltd",
        "station": "DBS-09",
        "quantity": 2500,
        "unit": "MT",
        "priority": "HIGH",
        "status": "PENDING",
        "timestamp": datetime.utcnow().isoformat(),
        "estimatedDelivery": datetime.utcnow().isoformat(),
        "description": "Urgent requirement for production line",
        "contact": "+91 98765 43210",
        "location": "Jamnagar Refinery",
    },
    {
        "id": "REQ-002",
        "type": "SGL",
        "requesterId": "SGL-001",
        "requesterName": "Indian Oil Corporation",
        "station": "DBS-12",
        "quantity": 1800,
        "unit": "MT",
        "priority": "MEDIUM",
        "status": "PENDING",
        "timestamp": datetime.utcnow().isoformat(),
        "estimatedDelivery": datetime.utcnow().isoformat(),
        "description": "Regular monthly supply requirement",
        "contact": "+91 98765 43211",
        "location": "Gujarat Terminal",
    },
    {
        "id": "REQ-003",
        "type": "AI",
        "requesterId": "AI-SYSTEM",
        "requesterName": "AI Demand Forecasting",
        "station": "DBS-05",
        "quantity": 3200,
        "unit": "MT",
        "priority": "HIGH",
        "status": "APPROVED",
        "timestamp": datetime.utcnow().isoformat(),
        "estimatedDelivery": datetime.utcnow().isoformat(),
        "description": "AI-predicted demand spike based on weather patterns",
        "contact": "System Generated",
        "location": "Ahmedabad Distribution Hub",
        "aiConfidence": 92,
    },
    {
        "id": "REQ-004",
        "type": "FDODO",
        "requesterId": "FDODO-002",
        "requesterName": "Essar Oil & Gas",
        "station": "DBS-15",
        "quantity": 1500,
        "unit": "MT",
        "priority": "LOW",
        "status": "PENDING",
        "timestamp": datetime.utcnow().isoformat(),
        "estimatedDelivery": datetime.utcnow().isoformat(),
        "description": "Planned maintenance requirement",
        "contact": "+91 98765 43212",
        "location": "Hazira Terminal",
    },
    {
        "id": "REQ-005",
        "type": "SGL",
        "requesterId": "SGL-002",
        "requesterName": "Bharat Petroleum Corporation",
        "station": "DBS-08",
        "quantity": 2200,
        "unit": "MT",
        "priority": "MEDIUM",
        "status": "REJECTED",
        "timestamp": datetime.utcnow().isoformat(),
        "estimatedDelivery": datetime.utcnow().isoformat(),
        "description": "Quality specifications not met in previous delivery",
        "contact": "+91 98765 43213",
        "location": "Mumbai Refinery",
        "rejectionReason": "Quality parameters below threshold",
    },
]

reconciliation_reports = [
    {
        "id": "REC-2025-001",
        "msStation": "MS-12",
        "msName": "Vastral Mother Station",
        "dbsStation": "DBS-09",
        "reportingPeriod": "2025-10-20",
        "severity": "HIGH",
        "status": "REVIEW_PENDING",
        "volumeDiscrepancy": 420,
        "financialImpact": 320000,
        "currency": "INR",
        "variancePercentage": 3.6,
        "rootCauseSignals": [
            "Meter drift detected on MS loading bay 2",
            "Unreconciled driver log for TRIP-014 on Oct 19",
        ],
        "recommendedAction": "Schedule immediate calibration and request updated delivery confirmation from DBS-09.",
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "correctiveActions": [],
    },
    {
        "id": "REC-2025-002",
        "msStation": "MS-07",
        "msName": "Naroda Mother Station",
        "dbsStation": "DBS-14",
        "reportingPeriod": "2025-10-18",
        "severity": "MEDIUM",
        "status": "ACTION_PENDING",
        "volumeDiscrepancy": 180,
        "financialImpact": 125000,
        "currency": "INR",
        "variancePercentage": 1.4,
        "rootCauseSignals": [
            "Late submission of DBS unloading log",
            "Minor variance in truck TRIP-011 post readings",
        ],
        "recommendedAction": "Request DBS reconciliation sign-off and monitor next two loads.",
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "correctiveActions": [
            {
                "actionId": "ACT-2025-1001",
                "triggeredBy": "EIC-Admin",
                "notes": "Contacted DBS-14 to resubmit unloading statement",
                "status": "IN_PROGRESS",
                "triggeredAt": datetime.utcnow().isoformat() + "Z",
            }
        ],
    },
]

pending_drivers = [
    {
        "id": "DRV-2025-001",
        "name": "Rahul Sharma",
        "phone": "+91 98765 55001",
        "licenseNumber": "GJ-13-2025-9981",
        "licenseExpiry": "2027-05-18",
        "trainingCompleted": False,
        "preferredShift": "NIGHT",
        "requestedShiftStart": "22:00",
        "requestedShiftEnd": "06:00",
        "submittedAt": datetime.utcnow().isoformat() + "Z",
        "documents": [
            {"type": "License Scan", "url": "https://example.com/docs/license9981"},
            {"type": "Medical Certificate", "url": "https://example.com/docs/med9981"},
        ],
        "remarks": "Prefers metro routes, 3 years LPG experience.",
    },
    {
        "id": "DRV-2025-002",
        "name": "Pooja Patel",
        "phone": "+91 98765 55002",
        "licenseNumber": "GJ-19-2023-4432",
        "licenseExpiry": "2026-11-02",
        "trainingCompleted": True,
        "trainingModules": ["Hazmat Handling", "Emergency Response"],
        "preferredShift": "DAY",
        "requestedShiftStart": "08:00",
        "requestedShiftEnd": "16:00",
        "submittedAt": datetime.utcnow().isoformat() + "Z",
        "documents": [
            {"type": "License Scan", "url": "https://example.com/docs/license4432"},
            {"type": "Background Verification", "url": "https://example.com/docs/bgv4432"},
        ],
        "remarks": "Completed refresher training last month.",
    },
]

active_drivers = {
    "4": {
        "id": "4",
        "name": "Rakesh Patel",
        "phone": "+91 98765 55000",
        "licenseNumber": "GJ-11-2019-1021",
        "licenseExpiry": "2025-12-31",
        "shiftStart": "08:00",
        "shiftEnd": "16:00",
        "trainingCompleted": True,
        "trainingModules": ["Hazmat Handling", "Vehicle Safety"],
        "status": "ACTIVE",
        "approvedAt": datetime.utcnow().isoformat() + "Z",
    }
}

rejected_drivers = []

ms_clusters = [
    {
        "id": "CLUSTER-001",
        "name": "North Gujarat Logistics",
        "msStation": {
            "id": "MS-12",
            "name": "Vastral Mother Station",
            "capacity": 32000,
            "location": "Ahmedabad",
        },
        "dbsStations": [
            {"id": "DBS-09", "name": "Isanpur DBS", "capacity": 8500},
            {"id": "DBS-14", "name": "Narol DBS", "capacity": 7200},
        ],
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "clusterManager": "EIC-Admin",
        "notes": "Primary supply chain for Ahmedabad metro. Review weekly.",
    },
    {
        "id": "CLUSTER-002",
        "name": "South Gujarat Distribution",
        "msStation": {
            "id": "MS-07",
            "name": "Surat Mother Station",
            "capacity": 28000,
            "location": "Surat",
        },
        "dbsStations": [
            {"id": "DBS-05", "name": "Navsari DBS", "capacity": 6400},
            {"id": "DBS-08", "name": "Valsad DBS", "capacity": 6100},
            {"id": "DBS-11", "name": "Bharuch DBS", "capacity": 7000},
        ],
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "clusterManager": "EIC-Admin",
        "notes": "Monitor Navsari throughput due to planned maintenance.",
    },
]

def get_eic_permissions(user_id: str) -> dict:
    default_perms = {
        "canApproveProposals": False,
        "canTriggerCorrectiveActions": False,
        "canManageDrivers": False,
        "canManageClusters": False,
    }
    if not user_id:
        return default_perms

    stored = eic_permissions.get(str(user_id), {})
    perms = default_perms.copy()
    perms.update({k: bool(v) for k, v in stored.items()})
    return perms


def set_eic_permissions(user_id: str, **kwargs) -> dict:
    current = eic_permissions.get(str(user_id), {})
    updated = {
        **current,
        **{k: bool(v) for k, v in kwargs.items() if v is not None},
    }
    eic_permissions[str(user_id)] = updated
    return get_eic_permissions(user_id)


def find_eic_request(request_id: str):
    return next((req for req in eic_stock_requests if req["id"] == request_id), None)


def compute_eic_summary(requests):
    pending_requests = [req for req in requests if req["status"] == "PENDING"]
    approved_requests = [req for req in requests if req["status"] == "APPROVED"]
    rejected_requests = [req for req in requests if req["status"] == "REJECTED"]

    total_quantity = sum(req.get("quantity", 0) for req in pending_requests)

    return {
        "pending": len(pending_requests),
        "approved": len(approved_requests),
        "rejected": len(rejected_requests),
        "totalQuantity": total_quantity,
        "priorityBreakdown": {
            "high": len([r for r in pending_requests if r.get("priority") == "HIGH"]),
            "medium": len([r for r in pending_requests if r.get("priority") == "MEDIUM"]),
            "low": len([r for r in pending_requests if r.get("priority") == "LOW"]),
        },
        "typeBreakdown": {
            "fdodo": len([r for r in pending_requests if r.get("type") == "FDODO"]),
            "sgl": len([r for r in pending_requests if r.get("type") == "SGL"]),
            "ai": len([r for r in pending_requests if r.get("type") == "AI"]),
        },
    }


def parse_iso(dt_str):
    if not dt_str:
        return None
    try:
        if isinstance(dt_str, datetime):
            return dt_str
        normalized = dt_str.replace("Z", "+00:00") if isinstance(dt_str, str) else dt_str
        return datetime.fromisoformat(normalized)
    except Exception:
        return None


def resolve_eic_user_id(payload: Optional[dict] = None):
    user_id = request.headers.get("X-User-Id") or request.args.get("userId")
    if not user_id and payload and isinstance(payload, dict):
        user_id = payload.get("userId")
    if not user_id:
        eic_user = next((u for u in users if u.get("role") == "EIC"), None)
        user_id = eic_user["id"] if eic_user else None
    return str(user_id) if user_id else None


def find_reconciliation_report(report_id: str):
    return next(
        (report for report in reconciliation_reports if report["id"] == report_id),
        None,
    )


# Use absolute path for credentials file
cred_path = os.path.join(os.path.dirname(__file__), "gts-app-ce5ca-firebase-adminsdk-fbsvc-560c4032e5.json")
if not os.path.exists(cred_path):
    print(f"âŒ Firebase credentials file not found at: {cred_path}")
    exit(1)

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
print(f"âœ… Firebase initialized with credentials: {cred_path}")

# In-memory store for device tokens (no DB)
# userId -> registration dict (drivers)
device_tokens = {}
# userId -> registration dict (DBS operators)
dbs_device_tokens = {}
# userId -> registration dict (MS operators)
ms_device_tokens = {}
# userId -> registration dict (EIC users)
eic_device_tokens = {}

# Replace with your device's actual FCM token for quick manual test (optional)
TEST_FCM_TOKEN = os.environ.get('TEST_FCM_TOKEN', 'YOUR_DEVICE_FCM_TOKEN')

def send_notification_to_device(token, title, body):
    print("Sending notification to token:", token, title, body)
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
    )
    # Send notification using Admin SDK
    response = messaging.send(message)
    return response

@app.route('/send-notification', methods=['GET'])
def send_notification_route():
    try:
        # Use the TEST_FCM_TOKEN from environment or return error if not set
        # if TEST_FCM_TOKEN == 'YOUR_DEVICE_FCM_TOKEN':
        #     return jsonify({
        #         'status': 'error', 
        #         'message': 'Please set TEST_FCM_TOKEN environment variable with a valid FCM token'
        #     }), 400
        
        response = send_notification_to_device(
            token="ecHfhtmaSfmmqbgyVRKj8Z:APA91bF9KzytrCDEb7fzR6zlKq3bX5kHYodor5Z3DyxsxYyD5gBdR0ELUYYycPdsxz8_ZGiswWqFHZ99znjzP9tMybysqCknumOypJdAeeZRbu2hznKjT7o",
            title='Hello from Flask!',
            body='This is a test push notification'
        )
        return jsonify({'status': 'sent', 'response': response})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# === API used by the mobile app ===
@app.route('/driver/notifications/register', methods=['POST'])
def register_driver_notifications():
    """Register a device token for a driver (no DB; in-memory only)."""
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    print("Registering device token...", user_id, device_token)

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    device_tokens[user_id] = {
        "userId": user_id,
        "deviceToken": device_token,
        "registeredAt": datetime.utcnow().isoformat() + "Z",
        "status": "ACTIVE",
    }
    return jsonify({
        "ok": True,
        "message": "Registered for push notifications",
        "registration": device_tokens[user_id],
    })


@app.route('/driver/notifications/unregister', methods=['POST'])
def unregister_driver_notifications():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    print("Unregistering device token...", user_id, device_token)

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    reg = device_tokens.get(user_id)
    if reg and reg.get('deviceToken') == device_token:
        del device_tokens[user_id]
        return jsonify({"ok": True, "message": "Driver device token unregistered"}), 200

    return jsonify({"ok": True, "message": "No matching driver registration found"}), 200


@app.route('/notifications/send', methods=['POST'])
def send_notification_to_driver():
    """Send a push notification to a registered driver via FCM."""
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    reg = device_tokens.get(user_id)
    if not reg:
        return jsonify({"error": "Driver not registered for notifications"}), 404

    title = (data.get('title') or 'Notification')
    body = (data.get('body') or '')
    custom_data = data.get('data') or {}
    # Ensure all data values are strings as required by FCM
    custom_data = {str(k): str(v) for k, v in custom_data.items()}

    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=custom_data,
        token=reg['deviceToken'],
        android=messaging.AndroidConfig(priority='high'),
    )
    try:
        response = messaging.send(message)
        return jsonify({"ok": True, "message": "Notification sent", "response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === DBS Notifications ===
@app.route('/dbs/notifications/register', methods=['POST'])
def register_dbs_notifications():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    dbs_device_tokens[user_id] = {
        "userId": user_id,
        "deviceToken": device_token,
        "registeredAt": datetime.utcnow().isoformat() + "Z",
        "status": "ACTIVE",
    }
    return jsonify({
        "ok": True,
        "message": "DBS registered for push notifications",
        "registration": dbs_device_tokens[user_id],
    })


@app.route('/dbs/notifications/unregister', methods=['POST'])
def unregister_dbs_notifications():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    reg = dbs_device_tokens.get(user_id)
    if reg and reg.get('deviceToken') == device_token:
        del dbs_device_tokens[user_id]
        print(f"Unregistered DBS device token for {user_id}: {device_token}")
        return jsonify({"ok": True, "message": "DBS device token unregistered"})

    return jsonify({"ok": True, "message": "No matching DBS registration found"}), 200

@app.route('/dbs/notifications/send-arrival', methods=['POST'])
def send_dbs_arrival_notification():
    """Send a dbs_arrival notification to a DBS user for a tripId."""
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    trip_id = str(data.get('tripId') or '').strip()
    dbs_id = str(data.get('dbsId') or '').strip()

    if not user_id or not trip_id:
        return jsonify({"error": "userId and tripId are required"}), 400

    reg = dbs_device_tokens.get(user_id)
    if not reg:
        return jsonify({"error": "DBS user not registered for notifications"}), 404

    # Ensure all data values strings
    custom_data = {
        "type": "dbs_arrival",
        "tripId": trip_id,
        "dbsId": dbs_id or "",
    }

    message = messaging.Message(
        notification=messaging.Notification(title="Truck arrived at your DBS", body=f"Trip {trip_id} has reached"),
        data=custom_data,
        token=reg['deviceToken'],
        android=messaging.AndroidConfig(priority='high'),
    )
    try:
        response = messaging.send(message)
        return jsonify({"ok": True, "message": "DBS arrival sent", "response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === MS Notifications ===
@app.route('/ms/notifications/register', methods=['POST'])
def register_ms_notifications():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    ms_device_tokens[user_id] = {
        "userId": user_id,
        "deviceToken": device_token,
        "registeredAt": datetime.utcnow().isoformat() + "Z",
        "status": "ACTIVE",
    }
    return jsonify({
        "ok": True,
        "message": "MS registered for push notifications",
        "registration": ms_device_tokens[user_id],
    })


@app.route('/ms/notifications/unregister', methods=['POST'])
def unregister_ms_notifications():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    reg = ms_device_tokens.get(user_id)
    if reg and reg.get('deviceToken') == device_token:
        del ms_device_tokens[user_id]
        print(f"Unregistered MS device token for {user_id}: {device_token}")
        return jsonify({"ok": True, "message": "MS device token unregistered"})

    return jsonify({"ok": True, "message": "No matching MS registration found"}), 200

@app.route('/ms/notifications/send-arrival', methods=['POST'])
def send_ms_arrival_notification():
    """Send an ms_arrival notification to an MS operator for a tripId/driverId."""
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    trip_id = str(data.get('tripId') or '').strip()
    driver_id = str(data.get('driverId') or '').strip()
    station_id = str(data.get('stationId') or '').strip()

    if not user_id or not trip_id or not driver_id:
        return jsonify({"error": "userId, tripId and driverId are required"}), 400

    reg = ms_device_tokens.get(user_id)
    if not reg:
        return jsonify({"error": "MS user not registered for notifications"}), 404

    custom_data = {
        "type": "ms_arrival",
        "tripId": trip_id,
        "driverId": driver_id,
        "stationId": station_id,
    }

    message = messaging.Message(
        notification=messaging.Notification(title="Truck arriving at your MS", body=f"Trip {trip_id} is arriving"),
        data={k: str(v) for k, v in custom_data.items()},
        token=reg['deviceToken'],
        android=messaging.AndroidConfig(priority='high'),
    )
    try:
        response = messaging.send(message)
        return jsonify({"ok": True, "message": "MS arrival sent", "response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ms/notifications/tokens', methods=['GET'])
def list_ms_tokens():
    return jsonify(list(ms_device_tokens.values()))

# === EIC Stock Requests & Permissions ===
@app.route('/eic/permissions', methods=['GET'])
def fetch_eic_permissions():
    user_id = resolve_eic_user_id()
    return jsonify(get_eic_permissions(user_id))


@app.route('/eic/permissions', methods=['POST'])
def update_eic_permissions():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    can_approve = data.get('canApproveProposals')
    can_trigger = data.get('canTriggerCorrectiveActions')
    can_manage = data.get('canManageDrivers')
    can_manage_clusters = data.get('canManageClusters')
    # Accept truthy strings/bools
    if isinstance(can_approve, str):
        can_approve = can_approve.lower() in ("1", "true", "yes", "on")
    if isinstance(can_trigger, str):
        can_trigger = can_trigger.lower() in ("1", "true", "yes", "on")
    if isinstance(can_manage, str):
        can_manage = can_manage.lower() in ("1", "true", "yes", "on")
    if isinstance(can_manage_clusters, str):
        can_manage_clusters = can_manage_clusters.lower() in ("1", "true", "yes", "on")
    perms = set_eic_permissions(
        user_id,
        canApproveProposals=can_approve,
        canTriggerCorrectiveActions=can_trigger,
        canManageDrivers=can_manage,
        canManageClusters=can_manage_clusters,
    )
    return jsonify({"ok": True, "permissions": perms})


@app.route('/eic/stock-requests', methods=['GET'])
def list_eic_stock_requests():
    type_filter = (request.args.get('type') or '').upper()
    status_filter = (request.args.get('status') or '').upper()
    priority_filter = (request.args.get('priority') or '').upper()

    filtered = []
    for req in eic_stock_requests:
        if type_filter and type_filter != "ALL" and req.get("type") != type_filter:
            continue
        if status_filter and status_filter != "ALL" and req.get("status") != status_filter:
            continue
        if priority_filter and priority_filter != "ALL" and req.get("priority") != priority_filter:
            continue
        filtered.append(req)

    summary = compute_eic_summary(filtered)
    return jsonify({
        "requests": filtered,
        "summary": {
            "pending": summary["pending"],
            "approved": summary["approved"],
            "rejected": summary["rejected"],
            "totalQuantity": summary["totalQuantity"],
        },
    })


@app.route('/eic/stock-requests/<request_id>', methods=['GET'])
def get_eic_stock_request(request_id):
    req = find_eic_request(request_id)
    if not req:
        return jsonify({"error": "Stock request not found"}), 404
    return jsonify(req)


def ensure_eic_can_approve(payload=None):
    user_id = resolve_eic_user_id(payload)
    perms = get_eic_permissions(user_id)
    if not perms.get("canApproveProposals"):
        return False, user_id
    return True, user_id


def ensure_eic_can_trigger(payload=None):
    user_id = resolve_eic_user_id(payload)
    perms = get_eic_permissions(user_id)
    if not perms.get("canTriggerCorrectiveActions"):
        return False, user_id
    return True, user_id


def ensure_eic_can_manage_drivers(payload=None):
    user_id = resolve_eic_user_id(payload)
    perms = get_eic_permissions(user_id)
    if not perms.get("canManageDrivers"):
        return False, user_id
    return True, user_id


def find_pending_driver(driver_id: str):
    return next((drv for drv in pending_drivers if drv["id"] == driver_id), None)


def remove_pending_driver(driver_id: str):
    global pending_drivers
    pending_drivers = [drv for drv in pending_drivers if drv["id"] != driver_id]


def ensure_eic_can_manage_clusters(payload=None):
    user_id = resolve_eic_user_id(payload)
    perms = get_eic_permissions(user_id)
    if not perms.get("canManageClusters"):
        return False, user_id
    return True, user_id


def find_cluster(cluster_id: str):
    return next((cluster for cluster in ms_clusters if cluster["id"] == cluster_id), None)


@app.route('/eic/stock-requests/<request_id>/approve', methods=['POST'])
def approve_eic_stock_request(request_id):
    data = request.get_json(silent=True) or {}
    allowed, user_id = ensure_eic_can_approve(data)
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    req = find_eic_request(request_id)
    if not req:
        return jsonify({"error": "Stock request not found"}), 404
    if req.get("status") != "PENDING":
        return jsonify({"error": "Only pending requests can be approved"}), 409

    req["status"] = "APPROVED"
    req["approvedAt"] = datetime.utcnow().isoformat()
    req["approvedBy"] = user_id
    req["approvalNotes"] = data.get("notes") or ""

    return jsonify({"ok": True, "request": req})


@app.route('/eic/stock-requests/<request_id>/reject', methods=['POST'])
def reject_eic_stock_request(request_id):
    data = request.get_json(silent=True) or {}
    allowed, user_id = ensure_eic_can_approve(data)
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    req = find_eic_request(request_id)
    if not req:
        return jsonify({"error": "Stock request not found"}), 404
    if req.get("status") != "PENDING":
        return jsonify({"error": "Only pending requests can be rejected"}), 409

    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "reason is required"}), 400

    req["status"] = "REJECTED"
    req["rejectedAt"] = datetime.utcnow().isoformat()
    req["rejectedBy"] = user_id
    req["rejectionReason"] = reason
    req["rejectionNotes"] = data.get("notes") or ""

    return jsonify({"ok": True, "request": req})


@app.route('/eic/dashboard', methods=['GET'])
def get_eic_dashboard():
    summary = compute_eic_summary(eic_stock_requests)
    now = datetime.utcnow().date()

    approved_today = 0
    rejected_today = 0
    for req in eic_stock_requests:
        approved_at = parse_iso(req.get("approvedAt"))
        rejected_at = parse_iso(req.get("rejectedAt"))
        if approved_at and approved_at.date() == now:
            approved_today += 1
        if rejected_at and rejected_at.date() == now:
            rejected_today += 1

    return jsonify({
        "totalRequests": len(eic_stock_requests),
        "pendingRequests": summary["pending"],
        "approvedToday": approved_today,
        "rejectedToday": rejected_today,
        "totalPendingQuantity": summary["totalQuantity"],
        "priorityBreakdown": summary["priorityBreakdown"],
        "typeBreakdown": summary["typeBreakdown"],
    })


# === EIC Driver Approvals ===
@app.route('/eic/driver-approvals/pending', methods=['GET'])
def list_pending_driver_approvals():
    allowed, _ = ensure_eic_can_manage_drivers()
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    return jsonify({
        "pending": pending_drivers,
        "total": len(pending_drivers),
    })


@app.route('/eic/driver-approvals/<driver_id>/approve', methods=['POST'])
def approve_pending_driver(driver_id):
    data = request.get_json(silent=True) or {}
    allowed, user_id = ensure_eic_can_manage_drivers(data)
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    driver = find_pending_driver(driver_id)
    if not driver:
        return jsonify({"error": "Pending driver not found"}), 404

    validation = {
        "licenseVerified": bool(data.get('licenseVerified', True)),
        "trainingVerified": bool(data.get('trainingVerified', True)),
        "shiftAssigned": bool(data.get('shiftAssigned', True)),
    }
    shift_start = str(data.get('shiftStart') or driver.get('requestedShiftStart') or "08:00")
    shift_end = str(data.get('shiftEnd') or driver.get('requestedShiftEnd') or "16:00")
    assigned_shift = {
        "shiftStart": shift_start,
        "shiftEnd": shift_end,
    }

    approved_driver = {
        **driver,
        "status": "ACTIVE",
        "approvedAt": datetime.utcnow().isoformat() + "Z",
        "approvedBy": user_id,
        "validation": validation,
        **assigned_shift,
        "trainingCompleted": bool(data.get('trainingCompleted', driver.get('trainingCompleted', False))),
        "trainingModules": data.get('trainingModules') or driver.get('trainingModules') or [],
        "notes": data.get('notes') or "",
    }

    active_drivers[driver_id] = approved_driver
    remove_pending_driver(driver_id)

    return jsonify({
        "ok": True,
        "driver": approved_driver,
    })


@app.route('/eic/driver-approvals/<driver_id>/reject', methods=['POST'])
def reject_pending_driver(driver_id):
    data = request.get_json(silent=True) or {}
    allowed, user_id = ensure_eic_can_manage_drivers(data)
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    driver = find_pending_driver(driver_id)
    if not driver:
        return jsonify({"error": "Pending driver not found"}), 404

    reason = (data.get('reason') or '').strip()
    if not reason:
        return jsonify({"error": "reason is required"}), 400

    driver_record = {
        **driver,
        "status": "REJECTED",
        "rejectedAt": datetime.utcnow().isoformat() + "Z",
        "rejectedBy": user_id,
        "rejectionReason": reason,
        "notes": data.get('notes') or "",
    }

    rejected_drivers.append(driver_record)
    remove_pending_driver(driver_id)

    return jsonify({
        "ok": True,
        "driver": driver_record,
    })



# === EIC Cluster Management ===
@app.route('/eic/clusters', methods=['GET'])
def list_clusters():
    allowed, _ = ensure_eic_can_manage_clusters()
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    return jsonify({
        "clusters": ms_clusters,
        "total": len(ms_clusters)
    })


@app.route('/eic/clusters/<cluster_id>', methods=['PUT'])
def update_cluster(cluster_id):
    data = request.get_json(silent=True) or {}
    allowed, user_id = ensure_eic_can_manage_clusters(data)
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    cluster = find_cluster(cluster_id)
    if not cluster:
        return jsonify({"error": "Cluster not found"}), 404

    dbs_stations = data.get('dbsStations')
    notes = data.get('notes')
    cluster_name = data.get('name')

    if isinstance(dbs_stations, list):
        cluster['dbsStations'] = dbs_stations
    if isinstance(notes, str):
        cluster['notes'] = notes
    if isinstance(cluster_name, str) and cluster_name.strip():
        cluster['name'] = cluster_name.strip()

    cluster['lastUpdated'] = datetime.utcnow().isoformat() + "Z"
    cluster['clusterManager'] = user_id or cluster.get('clusterManager')

    return jsonify({"ok": True, "cluster": cluster})


# === EIC Manual Token Assignment ===
@app.route('/eic/manual-tokens', methods=['GET'])
def list_manual_token_assignments():
    return jsonify({
        "tokens": manual_tokens,
        "total": len(manual_tokens)
    })


@app.route('/eic/manual-tokens', methods=['POST'])
def create_manual_token_assignment():
    data = request.get_json(silent=True) or {}

    customer_id = str(data.get('customerId') or '').strip()
    customer_name = str(data.get('customerName') or '').strip()
    ms_station = str(data.get('msStation') or '').strip()
    ms_slot = str(data.get('msSlot') or '').strip()
    product = str(data.get('product') or '').strip() or "LPG"
    unit = str(data.get('unit') or '').strip() or "KL"
    notes = str(data.get('notes') or '').strip()
    valid_until = str(data.get('validUntil') or '').strip()

    if not customer_id or not ms_station:
        return jsonify({"error": "customerId and msStation are required"}), 400

    quantity = data.get('quantity')
    try:
        quantity_value = float(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be a number"}), 400

    assigned_by = resolve_eic_user_id(data)
    token_id = f"MAN-{int(time.time())}"
    record = {
        "tokenId": token_id,
        "customerId": customer_id,
        "customerName": customer_name or None,
        "msStation": ms_station,
        "msSlot": ms_slot or None,
        "product": product,
        "quantity": quantity_value,
        "unit": unit,
        "validUntil": valid_until or None,
        "notes": notes,
        "status": "ASSIGNED",
        "assignedAt": datetime.utcnow().isoformat() + "Z",
        "assignedBy": assigned_by,
    }

    manual_tokens.insert(0, record)
    return jsonify({"ok": True, "token": record})


# === EIC Reconciliation Reports ===
@app.route('/eic/reconciliation/reports', methods=['GET'])
def list_reconciliation_reports():
    status_filter = (request.args.get('status') or '').upper()
    severity_filter = (request.args.get('severity') or '').upper()

    filtered = []
    for report in reconciliation_reports:
        if status_filter and status_filter != "ALL" and report.get("status", "").upper() != status_filter:
            continue
        if severity_filter and severity_filter != "ALL" and report.get("severity", "").upper() != severity_filter:
            continue
        filtered.append(report)

    return jsonify({
        "reports": filtered,
        "total": len(filtered),
    })


@app.route('/eic/reconciliation/reports/<report_id>/actions', methods=['POST'])
def trigger_reconciliation_action(report_id):
    data = request.get_json(silent=True) or {}
    allowed, user_id = ensure_eic_can_trigger(data)
    if not allowed:
        return jsonify({"error": "Permission denied"}), 403

    report = find_reconciliation_report(report_id)
    if not report:
        return jsonify({"error": "Reconciliation report not found"}), 404

    action_notes = str(data.get('notes') or '').strip()
    if not action_notes:
        return jsonify({"error": "notes is required"}), 400

    action_type = str(data.get('actionType') or 'GENERAL').strip() or "GENERAL"
    next_status = str(data.get('nextStatus') or '').strip()

    action = {
        "actionId": f"ACT-{int(time.time())}",
        "triggeredBy": user_id,
        "actionType": action_type.upper(),
        "notes": action_notes,
        "status": "IN_PROGRESS",
        "triggeredAt": datetime.utcnow().isoformat() + "Z",
    }

    report.setdefault("correctiveActions", []).insert(0, action)
    if next_status:
        report["status"] = next_status.upper()
    else:
        report["status"] = "ACTION_TRIGGERED"
    report["lastUpdated"] = datetime.utcnow().isoformat() + "Z"

    return jsonify({
        "ok": True,
        "report": report,
        "action": action,
    })


# === EIC Notifications ===
@app.route('/eic/notifications/register', methods=['POST'])
def register_eic_notifications():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    eic_device_tokens[user_id] = {
        "userId": user_id,
        "deviceToken": device_token,
        "registeredAt": datetime.utcnow().isoformat() + "Z",
        "status": "ACTIVE",
    }
    return jsonify({
        "success": True,
        "message": "EIC device token registered successfully",
        "registration": eic_device_tokens[user_id],
    })


@app.route('/eic/notifications/unregister', methods=['POST'])
def unregister_eic_notifications():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get('userId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    if not user_id or not device_token:
        return jsonify({"error": "userId and deviceToken are required"}), 400

    reg = eic_device_tokens.get(user_id)
    if reg and reg.get('deviceToken') == device_token:
        del eic_device_tokens[user_id]
        print(f"Unregistered EIC device token for {user_id}: {device_token}")
        return jsonify({"ok": True, "message": "EIC device token unregistered"})

    return jsonify({"ok": True, "message": "No matching EIC registration found"}), 200

@app.route('/eic/notifications/route-deviation', methods=['POST'])
def send_route_deviation_alert():
    """Send route deviation alert to EIC."""
    data = request.get_json(silent=True) or {}
    eic_user_id = str(data.get('eicUserId') or '').strip()
    trip_id = str(data.get('tripId') or '').strip()
    driver_id = str(data.get('driverId') or '').strip()
    current_location = str(data.get('currentLocation') or '').strip()
    deviation_distance = str(data.get('deviationDistance') or '').strip()

    if not eic_user_id or not trip_id or not driver_id:
        return jsonify({"error": "eicUserId, tripId and driverId are required"}), 400

    reg = eic_device_tokens.get(eic_user_id)
    if not reg:
        return jsonify({"error": "EIC user not registered for notifications"}), 404

    custom_data = {
        "type": "route_deviation",
        "tripId": trip_id,
        "driverId": driver_id,
        "currentLocation": current_location,
        "deviationDistance": deviation_distance,
    }

    message = messaging.Message(
        notification=messaging.Notification(
            title="Route Deviation Alert", 
            body=f"Driver {driver_id} has deviated {deviation_distance}m from planned route"
        ),
        data={k: str(v) for k, v in custom_data.items()},
        token=reg['deviceToken'],
        android=messaging.AndroidConfig(priority='high'),
    )
    try:
        response = messaging.send(message)
        return jsonify({
            "success": True, 
            "message": "Route deviation alert sent to EIC", 
            "notificationId": f"notif_route_{int(time.time())}",
            "response": response
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/eic/notifications/gas-variance', methods=['POST'])
def send_gas_variance_alert():
    """Send gas variance alert to EIC."""
    data = request.get_json(silent=True) or {}
    eic_user_id = str(data.get('eicUserId') or '').strip()
    trip_id = str(data.get('tripId') or '').strip()
    ms_dispatch_amount = data.get('msDispatchAmount')
    dbs_received_amount = data.get('dbsReceivedAmount')
    variance_percentage = data.get('variancePercentage')

    if not eic_user_id or not trip_id:
        return jsonify({"error": "eicUserId and tripId are required"}), 400

    reg = eic_device_tokens.get(eic_user_id)
    if not reg:
        return jsonify({"error": "EIC user not registered for notifications"}), 404

    custom_data = {
        "type": "gas_variance",
        "tripId": trip_id,
        "msDispatchAmount": str(ms_dispatch_amount or ''),
        "dbsReceivedAmount": str(dbs_received_amount or ''),
        "variancePercentage": str(variance_percentage or ''),
    }

    message = messaging.Message(
        notification=messaging.Notification(
            title="âš ï¸ Gas Variance Alert", 
            body=f"{variance_percentage}% variance: MS dispatched {ms_dispatch_amount}L, DBS received {dbs_received_amount}L"
        ),
        data={k: str(v) for k, v in custom_data.items()},
        token=reg['deviceToken'],
        android=messaging.AndroidConfig(priority='high'),
    )
    try:
        response = messaging.send(message)
        return jsonify({
            "success": True, 
            "message": "Gas variance alert sent to EIC", 
            "notificationId": f"notif_variance_{int(time.time())}",
            "response": response
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/eic/notifications/tokens', methods=['GET'])
def list_eic_tokens():
    return jsonify(list(eic_device_tokens.values()))

# === EIC Vehicle Tracking ===
@app.route('/eic/vehicles/active', methods=['GET'])
def get_active_vehicles():
    """Get all active vehicles with real-time data."""
    import random
    from datetime import datetime, timedelta
    
    # Mock active vehicles - replace with real DB query
    active_vehicles = [
        {
            "vehicleId": "GJ-01-AB-1234",
            "tripId": "TRIP_2025_001",
            "driverId": "DRV_123",
            "driverName": "Rakesh Patel",
            "currentLocation": {
                "latitude": 23.0225 + random.uniform(-0.1, 0.1),
                "longitude": 72.5714 + random.uniform(-0.1, 0.1),
                "address": "Near Sarkhej Circle, Ahmedabad"
            },
            "destination": {
                "latitude": 23.0896,
                "longitude": 72.6136,
                "address": "DBS Station Bopal, Ahmedabad"
            },
            "speed": random.randint(35, 65),
            "eta": (datetime.now() + timedelta(minutes=random.randint(15, 45))).isoformat(),
            "routeAdherence": random.choice(["ON_ROUTE", "MINOR_DEVIATION", "MAJOR_DEVIATION"]),
            "deviationDistance": random.randint(0, 1200) if random.choice([True, False]) else 0,
            "fuelLevel": random.randint(60, 95),
            "lastUpdated": datetime.now().isoformat(),
            "status": "IN_TRANSIT"
        },
        {
            "vehicleId": "GJ-02-CD-5678",
            "tripId": "TRIP_2025_002",
            "driverId": "DRV_456",
            "driverName": "Suresh Kumar",
            "currentLocation": {
                "latitude": 22.9734 + random.uniform(-0.05, 0.05),
                "longitude": 72.6046 + random.uniform(-0.05, 0.05),
                "address": "Paldi Cross Roads, Ahmedabad"
            },
            "destination": {
                "latitude": 23.1685,
                "longitude": 72.6386,
                "address": "MS Station Gandhinagar"
            },
            "speed": random.randint(25, 55),
            "eta": (datetime.now() + timedelta(minutes=random.randint(20, 60))).isoformat(),
            "routeAdherence": random.choice(["ON_ROUTE", "MINOR_DEVIATION"]),
            "deviationDistance": random.randint(0, 800) if random.choice([True, False]) else 0,
            "fuelLevel": random.randint(70, 90),
            "lastUpdated": datetime.now().isoformat(),
            "status": "IN_TRANSIT"
        },
        {
            "vehicleId": "GJ-03-EF-9012",
            "tripId": "TRIP_2025_003",
            "driverId": "DRV_789",
            "driverName": "Amit Shah",
            "currentLocation": {
                "latitude": 23.0458 + random.uniform(-0.02, 0.02),
                "longitude": 72.5678 + random.uniform(-0.02, 0.02),
                "address": "SG Highway, Ahmedabad"
            },
            "destination": {
                "latitude": 22.9876,
                "longitude": 72.4987,
                "address": "DBS Station Bavla"
            },
            "speed": random.randint(40, 70),
            "eta": (datetime.now() + timedelta(minutes=random.randint(10, 30))).isoformat(),
            "routeAdherence": "ON_ROUTE",
            "deviationDistance": 0,
            "fuelLevel": random.randint(80, 95),
            "lastUpdated": datetime.now().isoformat(),
            "status": "APPROACHING_DESTINATION"
        }
    ]
    
    return jsonify({
        "vehicles": active_vehicles,
        "totalActive": len(active_vehicles),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/eic/vehicles/<vehicle_id>/location-history', methods=['GET'])
def get_vehicle_location_history(vehicle_id):
    """Get location history for a specific vehicle."""
    import random
    from datetime import datetime, timedelta
    
    # Mock location history - replace with real tracking data
    history = []
    base_time = datetime.now() - timedelta(hours=2)
    
    for i in range(20):
        history.append({
            "timestamp": (base_time + timedelta(minutes=i*6)).isoformat(),
            "latitude": 23.0225 + random.uniform(-0.05, 0.05),
            "longitude": 72.5714 + random.uniform(-0.05, 0.05),
            "speed": random.randint(30, 70),
            "heading": random.randint(0, 360)
        })
    
    return jsonify({
        "vehicleId": vehicle_id,
        "locationHistory": history,
        "totalPoints": len(history)
    })

@app.route('/eic/vehicles/<vehicle_id>/route', methods=['GET'])
def get_vehicle_planned_route(vehicle_id):
    """Get planned route for a vehicle."""
    # Mock planned route - replace with real route planning API
    planned_route = [
        {"latitude": 23.0225, "longitude": 72.5714, "order": 1},
        {"latitude": 23.0350, "longitude": 72.5800, "order": 2},
        {"latitude": 23.0500, "longitude": 72.5900, "order": 3},
        {"latitude": 23.0650, "longitude": 72.6000, "order": 4},
        {"latitude": 23.0800, "longitude": 72.6100, "order": 5},
        {"latitude": 23.0896, "longitude": 72.6136, "order": 6}
    ]
    
    return jsonify({
        "vehicleId": vehicle_id,
        "plannedRoute": planned_route,
        "totalWaypoints": len(planned_route)
    })

# Token-based system storage
tokens = {}
manual_tokens = []
ms_sessions = {}
trips = {
    "TRIP-001": {
        "id": "TRIP-001", "status": "CREATED", "msId": "MS-12", "vehicle": "GJ-01-AB-1234",
        "driver": "Rakesh Patel", "driverId": "4", "pre": None, "startTime": None, "endTime": None,
        "post": None, "deliveredQty": None, "operatorSig": None, "driverSig": None
    }
}

# Token validation helper with mock support
def validate_token(token):
    if not token:
        return None, {"error": "Token required"}, 400
    
    # Handle mock tokens for development
    if token.startswith('MOCK-TKN-'):
        # Extract trip info from mock token
        parts = token.split('-')
        if len(parts) >= 4:
            trip_id = f"{parts[2]}-{parts[3]}"
            driver_id = parts[4] if len(parts) > 4 else "4"
        else:
            trip_id = "TRIP-001"
            driver_id = "4"
        
        # Create mock token data
        mock_token_data = {
            "token": token,
            "tripId": trip_id,
            "driverId": driver_id,
            "status": "ACTIVE",
            "createdAt": datetime.now().isoformat(),
            "isMock": True
        }
        return mock_token_data, None, None
    
    # Handle real tokens
    if token not in tokens:
        return None, {"error": "Invalid token"}, 400
    
    token_data = tokens[token]
    if token_data['status'] != 'ACTIVE':
        return None, {"error": "Token expired or cancelled"}, 400
    
    return token_data, None, None

# Generate token helper
def generate_token(trip_id, driver_id):
    timestamp = int(time.time())
    token = f"TKN-{trip_id}-{driver_id}-{timestamp}"
    
    token_data = {
        "token": token,
        "tripId": trip_id,
        "driverId": driver_id,
        "status": "ACTIVE",
        "createdAt": datetime.now().isoformat(),
        "validUntil": datetime.now().isoformat()  # In real system, add expiry logic
    }
    
    tokens[token] = token_data
    return token_data

# AUTH
@app.route('/auth/login', methods=['POST'])
def login():
    time.sleep(0.4)
    data = request.json
    username, password, role = data.get('username'), data.get('password'), data.get('role')
    
    # amazonq-ignore-next-line
    user = next((u for u in users if u['username'] == username and u['password'] == password), None)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    
    final_role = role or user['role']
    token = f"mock.{user['id']}.{final_role}.{int(time.time())}"
    permissions = get_eic_permissions(user['id']) if final_role == "EIC" else {}
    
    return jsonify({
        "token": token,
        "user": {
            "id": user['id'],
            "role": final_role,
            "name": user['name'],
            "permissions": permissions,
        }
    })

# PROPOSALS
@app.route('/proposals', methods=['GET'])
def fetch_proposals():
    return jsonify([
        {"id": "P001", "title": "Fuel Request A", "priority": 1, "score": 95},
        {"id": "P002", "title": "Fuel Request B", "priority": 2, "score": 87}
    ])

@app.route('/proposals/<id>/approve', methods=['POST'])
def approve_proposal(id):
    return jsonify({"ok": True, "proposalId": id, "status": "approved"})

# DRIVER - Token-based system
@app.route('/driver/mytrip', methods=['GET'])
def fetch_my_trip():
    return jsonify({"tripId": "TRIP-001", "status": "assigned", "destination": "DBS Station A"})

@app.route('/driver/trip/<trip_id>/accept', methods=['POST'])
def driver_accept_trip(trip_id):
    data = request.json
    driver_id = data.get('driverId')
    
    if not driver_id:
        return jsonify({"error": "Driver ID required"}), 400
    
    # Check if trip exists
    if trip_id not in trips:
        return jsonify({"error": "Trip not found"}), 404
    
    # Generate token for this trip-driver combination
    token_data = generate_token(trip_id, driver_id)
    
    # Update trip status
    trips[trip_id]['status'] = 'ACCEPTED'
    trips[trip_id]['acceptedAt'] = datetime.now().isoformat()
    
    return jsonify({
        "ok": True,
        "tripId": trip_id,
        "status": "accepted",
        "token": token_data['token'],
        "tokenData": token_data
    })

# Get active token for driver (for testing)
@app.route('/driver/<driver_id>/token', methods=['GET'])
def get_driver_token(driver_id):
    # Find active token for driver
    active_token = None
    for token, data in tokens.items():
        if data['driverId'] == driver_id and data['status'] == 'ACTIVE':
            active_token = data
            break
    
    if not active_token:
        return jsonify({"error": "No active token found"}), 404
    
    return jsonify(active_token)

# MS OPERATOR - Token-based Operations
@app.route('/ms/confirm-arrival', methods=['POST'])
def ms_confirm_arrival():
    data = request.json
    token = data.get('token')
    truck_number = data.get('truckNumber')
    operator_id = data.get('operatorId')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    if not truck_number:
        return jsonify({"error": "Truck number is required"}), 400
    
    # Generate session ID linked to token
    session_id = f"MS-{token_data['tripId']}-{int(time.time())}"
    
    # Store session with token reference
    ms_sessions[session_id] = {
        "sessionId": session_id,
        "token": token,
        "tripId": token_data['tripId'],
        "driverId": token_data['driverId'],
        "truckNumber": truck_number,
        "operatorId": operator_id,
        "status": "ARRIVAL_CONFIRMED",
        "timestamp": datetime.now().isoformat(),
        "preReading": None,
        "postReading": None,
        "sapDocument": None
    }
    
    return jsonify({
        "ok": True,
        "sessionId": session_id,
        "tripId": token_data['tripId'],
        "message": "Truck arrival confirmed successfully",
        "isMockToken": token_data.get('isMock', False)
    })

@app.route('/ms/pre-reading', methods=['POST'])
def ms_pre_reading():
    data = request.json
    session_id = data.get('sessionId')
    reading = data.get('reading')
    
    if not session_id or session_id not in ms_sessions:
        return jsonify({"error": "Invalid session ID"}), 400
    
    session = ms_sessions[session_id]
    
    # Validate token from session
    token_data, error, status_code = validate_token(session['token'])
    if error:
        return jsonify(error), status_code
    
    if reading is None or not isinstance(reading, (int, float)):
        return jsonify({"error": "Valid reading is required"}), 400
    
    if session['status'] != 'ARRIVAL_CONFIRMED':
        return jsonify({"error": "Invalid session status"}), 400
    
    session['preReading'] = reading
    session['status'] = 'PRE_READING_DONE'
    session['preTimestamp'] = datetime.now().isoformat()
    
    return jsonify({
        "ok": True,
        "message": "Pre meter reading saved successfully",
        "reading": reading,
        "tripId": token_data['tripId'],
        "isMockToken": token_data.get('isMock', False)
    })

@app.route('/ms/post-reading', methods=['POST'])
def ms_post_reading():
    data = request.json
    session_id = data.get('sessionId')
    reading = data.get('reading')
    
    if not session_id or session_id not in ms_sessions:
        return jsonify({"error": "Invalid session ID"}), 400
    
    session = ms_sessions[session_id]
    
    # Validate token from session
    token_data, error, status_code = validate_token(session['token'])
    if error:
        return jsonify(error), status_code
    
    if reading is None or not isinstance(reading, (int, float)):
        return jsonify({"error": "Valid reading is required"}), 400
    
    if session['status'] != 'PRE_READING_DONE':
        return jsonify({"error": "Invalid session status"}), 400
    
    session['postReading'] = reading
    session['status'] = 'POST_READING_DONE'
    session['postTimestamp'] = datetime.now().isoformat()
    
    return jsonify({
        "ok": True,
        "message": "Post meter reading saved successfully",
        "reading": reading,
        "tripId": token_data['tripId'],
        "isMockToken": token_data.get('isMock', False)
    })

@app.route('/ms/confirm-sap', methods=['POST'])
def ms_confirm_sap():
    data = request.json
    session_id = data.get('sessionId')
    
    if not session_id or session_id not in ms_sessions:
        return jsonify({"error": "Invalid session ID"}), 400
    
    session = ms_sessions[session_id]
    
    # Validate token from session
    token_data, error, status_code = validate_token(session['token'])
    if error:
        return jsonify(error), status_code
    
    if session['status'] != 'POST_READING_DONE':
        return jsonify({"error": "Invalid session status"}), 400
    
    # Generate SAP document number
    sap_document = f"SAP-{token_data['tripId']}-{session_id}-{int(time.time())}"
    
    session['sapDocument'] = sap_document
    session['status'] = 'COMPLETED'
    session['completedTimestamp'] = datetime.now().isoformat()
    
    # Calculate quantity (mock calculation)
    pre_reading = session.get('preReading', 0)
    post_reading = session.get('postReading', 0)
    quantity = abs(post_reading - pre_reading)
    session['quantity'] = quantity
    
    # Update trip status
    trip_id = token_data['tripId']
    if trip_id in trips:
        trips[trip_id]['msCompleted'] = True
        trips[trip_id]['msCompletedAt'] = datetime.now().isoformat()
    
    return jsonify({
        "ok": True,
        "message": "Data posted to SAP successfully",
        "sapDocument": sap_document,
        "quantity": quantity,
        "tripId": token_data['tripId'],
        "isMockToken": token_data.get('isMock', False),
        "session": session
    })

# Get MS session details
@app.route('/ms/session/<session_id>', methods=['GET'])
def get_ms_session(session_id):
    if session_id not in ms_sessions:
        return jsonify({"error": "Session not found"}), 404
    
    return jsonify(ms_sessions[session_id])

# Get all MS sessions (for admin/debugging)
@app.route('/ms/sessions', methods=['GET'])
def get_all_ms_sessions():
    return jsonify(list(ms_sessions.values()))

# STO
@app.route('/sto/<trip_id>/generate', methods=['POST'])
def generate_sto(trip_id):
    return jsonify({"ok": True, "tripId": trip_id, "stoNumber": f"STO-{trip_id}-001"})

# FDODO
@app.route('/fdodo/credit', methods=['GET'])
def fdodo_credit():
    return jsonify({"credit": 15000, "currency": "INR"})

@app.route('/fdodo/requests', methods=['POST'])
def fdodo_request():
    return jsonify({"ok": True, "requestId": "REQ-001", "status": "submitted"})

# DBS OPERATOR - Token-based Operations
@app.route('/dbs/decant/pre', methods=['POST'])
def dbs_pre_decant():
    data = request.json
    token = data.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    trip = trips.get(trip_id)
    if not trip or not trip.get('pre'):
        return jsonify({"error": "Trip not arrived yet"}), 404
    
    return jsonify({
        "tripId": trip_id,
        "token": token,
        "driverId": token_data['driverId'],
        "isMockToken": token_data.get('isMock', False),
        **trip['pre']
    })

@app.route('/dbs/decant/start', methods=['POST'])
def dbs_start_decant():
    data = request.json
    token = data.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    trip = trips.get(trip_id)
    if not trip or trip['status'] != 'ARRIVED':
        return jsonify({"error": "Trip not in ARRIVED state"}), 409
    
    trip['status'] = 'STARTED'
    trip['startTime'] = datetime.now().isoformat()
    
    return jsonify({
        "ok": True,
        "tripId": trip_id,
        "token": token,
        "startTime": trip['startTime'],
        "isMockToken": token_data.get('isMock', False)
    })

@app.route('/dbs/decant/end', methods=['POST'])
def dbs_end_decant():
    data = request.json
    token = data.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    trip = trips.get(trip_id)
    if not trip or trip['status'] != 'STARTED':
        return jsonify({"error": "Trip not in STARTED state"}), 409
    
    trip['status'] = 'ENDED'
    trip['endTime'] = datetime.now().isoformat()
    trip['post'] = {"pressure": 12.2, "flow": 0.0, "mfm": 101232.9, "time": datetime.now().isoformat()}
    
    return jsonify({
        "ok": True,
        "tripId": trip_id,
        "token": token,
        "endTime": trip['endTime'],
        "isMockToken": token_data.get('isMock', False),
        **trip['post']
    })

@app.route('/dbs/decant/confirm', methods=['POST'])
def dbs_confirm_decant():
    data = request.json
    token = data.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    trip = trips.get(trip_id)
    if not trip or trip['status'] != 'ENDED':
        return jsonify({"error": "Trip not in ENDED state"}), 409
    
    trip.update({
        'deliveredQty': data.get('deliveredQty'),
        'operatorSig': data.get('operatorSig'),
        'driverSig': data.get('driverSig'),
        'status': 'CONFIRMED',
        'confirmedAt': datetime.now().isoformat()
    })
    
    return jsonify({
        "ok": True,
        "tripId": trip_id,
        "token": token,
        "status": trip['status'],
        "isMockToken": token_data.get('isMock', False)
    })

@app.route('/dbs/deliveries', methods=['GET'])
def dbs_deliveries():
    return jsonify([{"id": "TRIP-001", "status": "pending", "driver": "Rakesh Patel"}])

@app.route('/dbs/history', methods=['GET'])
def dbs_history():
    return jsonify([{"id": "TRIP-000", "status": "completed", "date": "2024-01-15"}])

@app.route('/dbs/reconcile', methods=['GET'])
def dbs_reconcile():
    return jsonify([{"id": "REC-001", "amount": 5000, "status": "pending"}])

@app.route('/dbs/reconcile/push', methods=['POST'])
def dbs_push_reconcile():
    return jsonify({"ok": True, "pushed": request.json.get('ids', [])})

@app.route('/dbs/requests', methods=['POST'])
def dbs_manual_request():
    return jsonify({"ok": True, "requestId": "MAN-001", "status": "created"})

# Signal arrival (simulate VTS/RFID) - Token-based
@app.route('/dbs/decant/arrive', methods=['POST'])
def signal_arrival():
    data = request.json
    token = data.get('token')
    # If a raw tripId is provided (from notification gating) allow as well in dev
    trip_id_override = data.get('tripId')
    
    # Validate token or fallback to provided tripId
    token_data, error, status_code = validate_token(token) if token else (None, None, None)
    if error and not trip_id_override:
        return jsonify(error), status_code

    trip_id = trip_id_override or (token_data['tripId'] if token_data else None)
    if not trip_id:
        return jsonify({"error": "tripId or valid token required"}), 400
    trip = trips.get(trip_id, {"id": trip_id, "status": "CREATED"})
    trips[trip_id] = trip
    
    trip['status'] = 'ARRIVED'
    trip['arrivedAt'] = datetime.now().isoformat()
    trip['pre'] = {"pressure": 28.6, "flow": 124.5, "mfm": 100234.2, "time": datetime.now().isoformat()}
    
    return jsonify({
        "ok": True,
        "trip": trip,
        "token": token,
        "driverId": token_data['driverId'] if token_data else None,
        "isMockToken": token_data.get('isMock', False) if token_data else False
    })

# Choose role endpoint
@app.route('/auth/choose-role', methods=['POST'])
def choose_role():
    data = request.json
    return jsonify({"ok": True, "role": data.get('role')})

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ms_sessions_count": len(ms_sessions),
        "active_tokens_count": len([t for t in tokens.values() if t['status'] == 'ACTIVE']),
        "trips_count": len(trips)
    })

# DRIVER ENDPOINTS
@app.route('/driver/location', methods=['POST'])
def update_driver_location():
    data = request.json
    token = data.get('token')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    # Store location update (in real system, this would go to a location tracking service)
    location_update = {
        "driverId": token_data['driverId'],
        "tripId": token_data['tripId'],
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": datetime.now().isoformat()
    }
    
    return jsonify({
        "ok": True,
        "message": "Location updated successfully",
        "location": location_update
    })

@app.route('/driver/arrival/ms', methods=['POST'])
def confirm_driver_arrival_ms():
    data = request.json
    token = data.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    
    return jsonify({
        "ok": True,
        "message": "Arrival at MS confirmed",
        "tripId": trip_id,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/driver/arrival/dbs', methods=['POST'])
def confirm_driver_arrival_dbs():
    data = request.json
    token = data.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    
    return jsonify({
        "ok": True,
        "message": "Arrival at DBS confirmed",
        "tripId": trip_id,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/driver/meter-reading/confirm', methods=['POST'])
def confirm_driver_meter_reading():
    data = request.json
    token = data.get('token')
    station_type = data.get('stationType')  # 'MS' or 'DBS'
    reading_type = data.get('readingType')  # 'pre' or 'post'
    reading = data.get('reading')
    confirmed = data.get('confirmed')  # true or false
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    
    confirmation_data = {
        "tripId": trip_id,
        "driverId": token_data['driverId'],
        "stationType": station_type,
        "readingType": reading_type,
        "reading": reading,
        "confirmed": confirmed,
        "timestamp": datetime.now().isoformat()
    }
    
    return jsonify({
        "ok": True,
        "message": f"Meter reading {'confirmed' if confirmed else 'rejected'}",
        "confirmation": confirmation_data
    })

@app.route('/driver/meter-readings/<station_type>', methods=['GET'])
def get_driver_meter_readings(station_type):
    token = request.args.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    # Mock readings based on station type
    if station_type.upper() == 'MS':
        readings = {
            "preReading": 1250.5,
            "postReading": 1750.8,  # Available after filling
            "stationType": "MS",
            "status": "available"
        }
    elif station_type.upper() == 'DBS':
        readings = {
            "preReading": 1750.8,  # Same as MS post reading
            "postReading": 1250.5,  # Available after delivery
            "stationType": "DBS",
            "status": "available"
        }
    else:
        return jsonify({"error": "Invalid station type"}), 400
    
    return jsonify(readings)

@app.route('/driver/trip/complete', methods=['POST'])
def complete_driver_trip():
    data = request.json
    token = data.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    
    # Mark trip as completed
    if trip_id in trips:
        trips[trip_id]['status'] = 'COMPLETED'
        trips[trip_id]['completedAt'] = datetime.now().isoformat()
    
    # Mark token as completed
    if token in tokens:
        tokens[token]['status'] = 'COMPLETED'
        tokens[token]['completedAt'] = datetime.now().isoformat()
    
    return jsonify({
        "ok": True,
        "message": "Trip completed successfully",
        "tripId": trip_id,
        "completedAt": datetime.now().isoformat()
    })

@app.route('/driver/emergency', methods=['POST'])
def report_driver_emergency():
    data = request.json
    token = data.get('token')
    emergency_type = data.get('emergencyType')
    location = data.get('location')
    description = data.get('description')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    emergency_id = f"EMG-{token_data['tripId']}-{int(time.time())}"
    
    emergency_report = {
        "emergencyId": emergency_id,
        "tripId": token_data['tripId'],
        "driverId": token_data['driverId'],
        "emergencyType": emergency_type,
        "location": location,
        "description": description,
        "timestamp": datetime.now().isoformat(),
        "status": "REPORTED"
    }
    
    return jsonify({
        "ok": True,
        "message": "Emergency reported successfully",
        "emergencyId": emergency_id,
        "emergency": emergency_report
    })

@app.route('/driver/trip/status', methods=['GET'])
def get_driver_trip_status():
    token = request.args.get('token')
    
    # Validate token
    token_data, error, status_code = validate_token(token)
    if error:
        return jsonify(error), status_code
    
    trip_id = token_data['tripId']
    trip = trips.get(trip_id, {})
    
    return jsonify({
        "tripId": trip_id,
        "status": trip.get('status', 'UNKNOWN'),
        "tokenStatus": token_data['status'],
        "trip": trip
    })

# Store device tokens

@app.route('/notifications/send', methods=['POST'])
def send_notification():
    data = request.json
    driver_id = data.get('driverId')
    title = data.get('title')
    body = data.get('body')
    notification_data = data.get('data', {})
    
    if driver_id not in device_tokens:
        return jsonify({"error": "Driver not registered for notifications"}), 404
    
    # In real system, this would send via Firebase Admin SDK
    notification = {
        "notificationId": f"NOTIF-{driver_id}-{int(time.time())}",
        "driverId": driver_id,
        "title": title,
        "body": body,
        "data": notification_data,
        "sentAt": datetime.now().isoformat(),
        "status": "SENT"
    }
    
    return jsonify({
        "ok": True,
        "message": "Notification sent successfully",
        "notification": notification
    })

@app.route('/notifications/test', methods=['POST'])
def test_notification():
    data = request.json
    driver_id = data.get('driverId', '7')
    
    # Send test notification
    test_notification = {
        "driverId": driver_id,
        "title": "Test Notification",
        "body": "This is a test push notification from GTS App",
        "data": {
            "type": "test",
            "timestamp": datetime.now().isoformat()
        }
    }
    
    return jsonify({
        "ok": True,
        "message": "Test notification triggered",
        "notification": test_notification
    })

# Token management endpoints
@app.route('/tokens', methods=['GET'])
def get_all_tokens():
    return jsonify(list(tokens.values()))

@app.route('/tokens/<token>/revoke', methods=['POST'])
def revoke_token(token):
    if token in tokens:
        tokens[token]['status'] = 'REVOKED'
        tokens[token]['revokedAt'] = datetime.now().isoformat()
        return jsonify({"ok": True, "message": "Token revoked"})
    return jsonify({"error": "Token not found"}), 404

if __name__ == '__main__':
    print('GTS Token-Based API Server starting...')
    print('Available at: http://localhost:5000')
    print('Test login: dbs/dbs123, eic/password, ms/ms123, driver/driver123, fdodo/fdodo123, sgl/sgl123')
    print('Update your React Native app config to point to http://localhost:5000')
    print('Token-based Operations:')
    print('   - POST /driver/trip/{id}/accept (get token)')
    print('   - GET /driver/{id}/token (check token)')
    print('MS Operations (token-based):')
    print('   - POST /ms/confirm-arrival')
    print('   - POST /ms/pre-reading')
    print('   - POST /ms/post-reading')
    print('   - POST /ms/confirm-sap')
    print('DBS Operations (token-based):')
    print('   - POST /dbs/decant/arrive')
    print('   - POST /dbs/decant/pre')
    print('   - POST /dbs/decant/start')
    print('   - POST /dbs/decant/end')
    print('   - POST /dbs/decant/confirm')
    # amazonq-ignore-next-line
    app.run(debug=True, host='0.0.0.0', port=5000)
