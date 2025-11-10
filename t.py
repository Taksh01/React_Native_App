from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, messaging

app = Flask(__name__)
CORS(app)

# Load service account credentials (prefer env var)
cred_path = ("gts-app-ce5ca-firebase-adminsdk-fbsvc-560c4032e5.json")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

# In-memory store for device tokens (no DB)
# driverId -> registration dict
device_tokens = {}

# Replace with your device's actual FCM token for quick manual test (optional)
TEST_FCM_TOKEN = os.environ.get('TEST_FCM_TOKEN', 'YOUR_DEVICE_FCM_TOKEN')

def send_notification_to_device(token, title, body):
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
        response = send_notification_to_device(
            token=TEST_FCM_TOKEN,
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
    driver_id = str(data.get('driverId') or '').strip()
    device_token = str(data.get('deviceToken') or '').strip()

    if not driver_id or not device_token:
        return jsonify({"error": "driverId and deviceToken are required"}), 400

    device_tokens[driver_id] = {
        "driverId": driver_id,
        "deviceToken": device_token,
        "registeredAt": datetime.utcnow().isoformat() + "Z",
        "status": "ACTIVE",
    }
    return jsonify({
        "ok": True,
        "message": "Registered for push notifications",
        "registration": device_tokens[driver_id],
    })


@app.route('/notifications/send', methods=['POST'])
def send_notification_to_driver():
    """Send a push notification to a registered driver via FCM."""
    data = request.get_json(silent=True) or {}
    driver_id = str(data.get('driverId') or '').strip()
    if not driver_id:
        return jsonify({"error": "driverId is required"}), 400

    reg = device_tokens.get(driver_id)
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

if __name__ == '__main__':
    # Bind to 0.0.0.0 so your phone can reach this server over LAN
    app.run(host='0.0.0.0', port=5000, debug=True)






