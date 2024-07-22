import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
from zoom import ZoomClient
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
load_dotenv('ids.env')

ZOOM_ACCOUNT_ID = os.environ.get("ZOOM_ACCOUNT_ID")
ZOOM_CLIENT_ID = os.environ.get("ZOOM_CLIENT_ID")
ZOOM_CLIENT_SECRET = os.environ.get("ZOOM_CLIENT_SECRET")
ZOOM_SECRET_TOKEN = os.environ.get("ZOOM_SECRET_TOKEN")  # Ensure this is loaded

# Create the ZoomClient instance
zoom_client = ZoomClient(ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_SECRET_TOKEN)

@app.route('/recordings', methods=['GET'])
def get_recordings():
    name_query = request.args.get('name_query', '')
    transcript_query = request.args.get('transcript_query', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')

    try:
        recordings = zoom_client.filter_recordings(name_query, transcript_query, start_date, end_date)
        return jsonify({'meetings': recordings})
    except Exception as e:
        logging.error(f"Error fetching recordings: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/transcript', methods=['GET'])
def get_transcript():
    meeting_id = request.args.get('meeting_id')
    if not meeting_id:
        return jsonify({"error": "meeting_id parameter is required"}), 400
    try:
        transcript_url = zoom_client.get_transcript_url(meeting_id)
        if transcript_url:
            transcript = zoom_client.download_transcript(transcript_url)
            return jsonify({"transcript": transcript})
        else:
            return jsonify({"error": "Transcript is still being transcribed. Please check back later"}), 404
    except Exception as e:
        print(f"Error fetching transcript: {e}")
        return jsonify({"error": str(e)}), 400
    

if __name__ == '__main__':
    app.run(debug=True)












# import os
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from dotenv import load_dotenv
# from datetime import datetime
# from zoom import ZoomClient
# import logging

# app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
# load_dotenv('ids.env')

# ZOOM_ACCOUNT_ID = os.environ.get("ZOOM_ACCOUNT_ID")
# ZOOM_CLIENT_ID = os.environ.get("ZOOM_CLIENT_ID")
# ZOOM_CLIENT_SECRET = os.environ.get("ZOOM_CLIENT_SECRET")
# ZOOM_SECRET_TOKEN = os.environ.get("ZOOM_SECRET_TOKEN")  # Ensure this is loaded
# OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")  # Load the OpenAI API key

# # Create the ZoomClient instance
# zoom_client = ZoomClient(ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_SECRET_TOKEN, OPENAI_API_KEY)

# @app.route('/recordings', methods=['GET'])
# def get_recordings():
#     name_query = request.args.get('name_query', '')
#     transcript_query = request.args.get('transcript_query', '')
#     start_date = request.args.get('start_date', '')
#     end_date = request.args.get('end_date', '')

#     try:
#         recordings = zoom_client.filter_recordings(name_query, transcript_query, start_date, end_date)
#         return jsonify({'meetings': recordings})
#     except Exception as e:
#         logging.error(f"Error fetching recordings: {e}")
#         return jsonify({'error': str(e)}), 400

# @app.route('/transcript', methods=['GET'])
# def get_transcript():
#     meeting_id = request.args.get('meeting_id')
#     if not meeting_id:
#         return jsonify({"error": "meeting_id parameter is required"}), 400
#     try:
#         transcript_url = zoom_client.get_transcript_url(meeting_id)
#         if transcript_url:
#             transcript = zoom_client.download_transcript(transcript_url)
#             return jsonify({"transcript": transcript})
#         else:
#             return jsonify({"error": "Transcript is still being transcribed. Please check back later"}), 404
#     except Exception as e:
#         print(f"Error fetching transcript: {e}")
#         return jsonify({"error": str(e)}), 400
    
# @app.route('/summarize', methods=['POST'])
# def summarize_transcript():
#     data = request.get_json()
#     transcript = data.get('transcript')
#     if not transcript:
#         return jsonify({"error": "Transcript is required"}), 400

#     try:
#         summary = zoom_client.summarize_transcript(transcript)
#         return jsonify({"summary": summary})
#     except Exception as e:
#         print(f"Error summarizing transcript: {e}")
#         return jsonify({"error": str(e)}), 400

# if __name__ == '__main__':
#     app.run(debug=True)


