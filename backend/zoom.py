import requests
import base64
from datetime import datetime
import re
import logging
import os
from flask_cors import CORS
from dotenv import load_dotenv


load_dotenv('ids.env')

class ZoomClient:

    def __init__(self, account_id, client_id, client_secret, secret_token):
        self.account_id = account_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.secret_token = secret_token
        self.access_token = self.get_access_token()
        self.default_from_date = os.getenv('DEFAULT_FROM_DATE')

        print(f"Account ID: {self.account_id}")
        print(f"Client ID: {self.client_id}")
        print(f"Client Secret: {self.client_secret}")
        print(f"Secret Token: {self.secret_token}")
        print(f"Access Token: {self.access_token}")

    ### Getters ###
    def get_access_token(self):
        print("Getting access token...")
        url = 'https://zoom.us/oauth/token'
        auth_header = base64.b64encode(f'{self.client_id}:{self.client_secret}'.encode()).decode()
        headers = {
            'Authorization': f'Basic {auth_header}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        data = {
            'grant_type': 'account_credentials',
            'account_id': self.account_id
        }
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
        print(f"Access token response: {response.json()}")
        return response.json().get('access_token')

    def get_recordings(self):
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Zoom-Secret-Token": self.secret_token
        }
        today = datetime.today().strftime('%Y-%m-%d')
        params = {
            "page_size": 30,
            "from": "2023-01-01",  # Adjust date range as needed
            "to": today
        }
        url = "https://api.zoom.us/v2/users/me/recordings"
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()

    def get_transcript_url(self, meeting_id):
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Zoom-Secret-Token": self.secret_token
        }
        url = f"https://api.zoom.us/v2/meetings/{meeting_id}/recordings"
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        for file in response.json().get('recording_files', []):
            if file.get('recording_type') == 'audio_transcript':
                # Check if a passcode is required
                passcode = file.get('passcode')
                download_url = file.get('download_url')
                if passcode:
                    transcript_url = f"{download_url}?access_token={self.access_token}&pwd={passcode}"
                else:
                    transcript_url = f"{download_url}?access_token={self.access_token}"
                return transcript_url
        return None

    ### Transcript ###
    def download_transcript(self, url):
        headers = {
            "Zoom-Secret-Token": self.secret_token
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        transcript = response.text
        return self.clean_transcript(transcript)

    @staticmethod
    def clean_transcript(transcript):
        clean_lines = []
        for line in transcript.splitlines():
            if line.strip() != "WEBVTT" and not re.match(r'^\d+$', line) and not re.match(r'^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$', line):
                clean_lines.append(line)
        cleaned_transcript = '\n'.join(clean_lines)
        return cleaned_transcript
    

    def filter_recordings_by_name(self, recordings, name_query):
        print(f"Filtering recordings by name: {name_query}")
        filtered_recordings = []
        for meeting in recordings:
            meeting_id = meeting['id']
            print(f"Checking participants for meeting ID: {meeting_id}")
            url = f"https://api.zoom.us/v2/report/meetings/{meeting_id}/participants"
            response = requests.get(url, headers={
                "Authorization": f"Bearer {self.access_token}"
            })
            if response.status_code == 200:
                participants = response.json().get("participants", [])
                print(f"Participants in meeting ID {meeting_id}: {participants}")
                for participant in participants:
                    if participant.get('name') == name_query:
                        filtered_recordings.append(meeting)
                        break
            else:
                print(f"Error fetching participants for meeting ID {meeting_id}: {response.status_code}")
        return filtered_recordings

    def filter_recordings_by_date(self, recordings, start_date, end_date):
        print(f"Filtering recordings by date range: {start_date} to {end_date}")
        filtered_recordings = []
        for meeting in recordings:
            meeting_id = meeting['id']
            url = f"https://api.zoom.us/v2/report/meetings/{meeting_id}/participants"
            response = requests.get(url, headers={
                "Authorization": f"Bearer {self.access_token}"
            })
            if response.status_code == 200:
                participants = response.json().get("participants", [])
                for participant in participants:
                    participant_join_date = datetime.strptime(participant.get('join_time', '').split('T')[0], '%Y-%m-%d')
                    if self.is_within_date_range(participant_join_date, start_date, end_date):
                        filtered_recordings.append(meeting)
                        break
            else:
                print(f"Error fetching participants for meeting ID {meeting_id}: {response.status_code}")
        return filtered_recordings

    def filter_recordings_by_name_and_date(self, name_query, start_date, end_date, recordings):
        print(f"Filtering recordings by name: {name_query} and date range: {start_date} to {end_date}")
        filtered_recordings = []
        for meeting in recordings:
            meeting_id = meeting['id']
            url = f"https://api.zoom.us/v2/report/meetings/{meeting_id}/participants"
            response = requests.get(url, headers={
                "Authorization": f"Bearer {self.access_token}"
            })
            if response.status_code == 200:
                participants = response.json().get("participants", [])
                for participant in participants:
                    participant_join_date = datetime.strptime(participant.get('join_time', '').split('T')[0], '%Y-%m-%d')
                    if participant.get('name') == name_query and self.is_within_date_range(participant_join_date, start_date, end_date):
                        filtered_recordings.append(meeting)
                        break
            else:
                print(f"Error fetching participants for meeting ID {meeting_id}: {response.status_code}")
        return filtered_recordings
    
    def filter_recordings_by_transcript(self, recordings, word):
        matched_meetings = []
        logging.info(f"Filtering recordings by transcript for word: {word}")

        for meeting in recordings:
            meeting_id = meeting['id']
            logging.info(f"Checking transcript for meeting ID {meeting_id}")
            transcript_url = self.get_transcript_url(meeting_id)
            if transcript_url:
                transcript = self.download_transcript(transcript_url)
                clean_transcript = self.clean_transcript(transcript)
                if word.lower() in clean_transcript.lower():
                    matched_meetings.append(meeting)
                    logging.info(f"Word '{word}' found in meeting ID {meeting_id}")
                else:
                    logging.info(f"Word '{word}' not found in meeting ID {meeting_id}")
            else:
                logging.info(f"No transcript found for meeting ID {meeting_id}")

        return matched_meetings

    def filter_recordings(self, name_query, transcript_query, start_date, end_date):
        print(f"Filtering recordings with name: {name_query}, start_date: {start_date}, end_date: {end_date}, transcript_query: {transcript_query}")
        recordings = self.get_recordings().get('meetings', [])
        filtered_recordings = []

        if transcript_query and name_query and start_date and end_date:
            recordings = self.filter_recordings_by_name_and_date(name_query, start_date, end_date, recordings)
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif transcript_query and name_query and start_date:
            recordings = self.filter_recordings_by_name_and_date(name_query, start_date, datetime.today().strftime('%Y-%m-%d'), recordings)
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif transcript_query and name_query and end_date:
            recordings = self.filter_recordings_by_name_and_date(name_query, self.default_from_date, end_date, recordings)
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif transcript_query and name_query:
            recordings = self.filter_recordings_by_name(recordings, name_query)
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif transcript_query and start_date and end_date:
            recordings = self.filter_recordings_by_date(recordings, start_date, end_date)
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif transcript_query and start_date:
            recordings = self.filter_recordings_by_date(recordings, start_date, datetime.today().strftime('%Y-%m-%d'))
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif transcript_query and end_date:
            recordings = self.filter_recordings_by_date(recordings, self.default_from_date, end_date)
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif transcript_query:
            filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
        elif name_query and start_date and end_date:
            filtered_recordings = self.filter_recordings_by_name_and_date(name_query, start_date, end_date, recordings)
        elif name_query and start_date:
            filtered_recordings = self.filter_recordings_by_name_and_date(name_query, start_date, datetime.today().strftime('%Y-%m-%d'), recordings)
        elif name_query and end_date:
            filtered_recordings = self.filter_recordings_by_name_and_date(name_query, self.default_from_date, end_date, recordings)
        elif name_query:
            filtered_recordings = self.filter_recordings_by_name(recordings, name_query)
        elif start_date and end_date:
            filtered_recordings = self.filter_recordings_by_date(recordings, start_date, end_date)
        elif start_date:
            filtered_recordings = self.filter_recordings_by_date(recordings, start_date, datetime.today().strftime('%Y-%m-%d'))
        elif end_date:
            filtered_recordings = self.filter_recordings_by_date(recordings, self.default_from_date, end_date)
        else:
            filtered_recordings = recordings

        return filtered_recordings

    def is_within_date_range(self, join_date, start_date, end_date):
        print(f"Checking if join date: {join_date} is within range: {start_date} to {end_date}")
        if start_date and join_date < datetime.strptime(start_date, '%Y-%m-%d'):
            return False
        if end_date and join_date > datetime.strptime(end_date, '%Y-%m-%d'):
            return False
        return True





















# import requests
# import base64
# from datetime import datetime
# import re
# from openai import OpenAI, OpenAIError
# import openai
# import logging
# import os
# from flask_cors import CORS
# from dotenv import load_dotenv


# load_dotenv('ids.env')

# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# class ZoomClient:

#     def __init__(self, account_id, client_id, client_secret, secret_token, openai_api_key):
#         self.account_id = account_id
#         self.client_id = client_id
#         self.client_secret = client_secret
#         self.secret_token = secret_token
#         self.openai_client = OpenAI(api_key=openai_api_key)  # Properly instantiate the OpenAI client
#         self.access_token = self.get_access_token()
#         self.default_from_date = os.getenv('DEFAULT_FROM_DATE')

#         print(f"Account ID: {self.account_id}")
#         print(f"Client ID: {self.client_id}")
#         print(f"Client Secret: {self.client_secret}")
#         print(f"Secret Token: {self.secret_token}")
#         print(f"Access Token: {self.access_token}")

#     ### Getters ###
#     def get_access_token(self):
#         print("Getting access token...")
#         url = 'https://zoom.us/oauth/token'
#         auth_header = base64.b64encode(f'{self.client_id}:{self.client_secret}'.encode()).decode()
#         headers = {
#             'Authorization': f'Basic {auth_header}',
#             'Content-Type': 'application/x-www-form-urlencoded'
#         }
#         data = {
#             'grant_type': 'account_credentials',
#             'account_id': self.account_id
#         }
#         response = requests.post(url, headers=headers, data=data)
#         response.raise_for_status()  # Raise an exception for HTTP errors
#         print(f"Access token response: {response.json()}")
#         return response.json().get('access_token')

#     def get_recordings(self):
#         headers = {
#             "Authorization": f"Bearer {self.access_token}",
#             "Zoom-Secret-Token": self.secret_token
#         }
#         today = datetime.today().strftime('%Y-%m-%d')
#         params = {
#             "page_size": 30,
#             "from": "2023-01-01",  # Adjust date range as needed
#             "to": today
#         }
#         url = "https://api.zoom.us/v2/users/me/recordings"
#         response = requests.get(url, headers=headers, params=params)
#         response.raise_for_status()  # Raise an exception for HTTP errors
#         return response.json()

#     def get_transcript_url(self, meeting_id):
#         headers = {
#             "Authorization": f"Bearer {self.access_token}",
#             "Zoom-Secret-Token": self.secret_token
#         }
#         url = f"https://api.zoom.us/v2/meetings/{meeting_id}/recordings"
#         response = requests.get(url, headers=headers)
#         response.raise_for_status()  # Raise an exception for HTTP errors
#         for file in response.json().get('recording_files', []):
#             if file.get('recording_type') == 'audio_transcript':
#                 # Check if a passcode is required
#                 passcode = file.get('passcode')
#                 download_url = file.get('download_url')
#                 if passcode:
#                     transcript_url = f"{download_url}?access_token={self.access_token}&pwd={passcode}"
#                 else:
#                     transcript_url = f"{download_url}?access_token={self.access_token}"
#                 return transcript_url
#         return None

#     ### Transcript ###
#     def download_transcript(self, url):
#         headers = {
#             "Zoom-Secret-Token": self.secret_token
#         }
#         response = requests.get(url, headers=headers)
#         response.raise_for_status()  # Raise an exception for HTTP errors
#         transcript = response.text
#         return self.clean_transcript(transcript)
    
#     def summarize_transcript(self, transcript):
#         print("Summarizing transcript...")
#         try:
#             response = self.openai_client.chat.completions.create(
#                 model="gpt-3.5-turbo",  # Change model to gpt-3.5-turbo
#                 temperature=0.7,
#                 messages=[
#                     {
#                         "role": "system",
#                         "content": "You are a helpful assistant that summarizes transcripts."
#                     },
#                     {
#                         "role": "user",
#                         "content": transcript
#                     }
#                 ]
#             )
#             summary = response.choices[0].message.content
#             return summary
#         except openai.OpenAIError as e:
#             print(f"Error summarizing transcript: {e}")
#             return str(e)

#     @staticmethod
#     def clean_transcript(transcript):
#         clean_lines = []
#         for line in transcript.splitlines():
#             if line.strip() != "WEBVTT" and not re.match(r'^\d+$', line) and not re.match(r'^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$', line):
#                 clean_lines.append(line)
#         cleaned_transcript = '\n'.join(clean_lines)
#         return cleaned_transcript
    

#     def filter_recordings_by_name(self, recordings, name_query):
#         print(f"Filtering recordings by name: {name_query}")
#         filtered_recordings = []
#         for meeting in recordings:
#             meeting_id = meeting['id']
#             print(f"Checking participants for meeting ID: {meeting_id}")
#             url = f"https://api.zoom.us/v2/report/meetings/{meeting_id}/participants"
#             response = requests.get(url, headers={
#                 "Authorization": f"Bearer {self.access_token}"
#             })
#             if response.status_code == 200:
#                 participants = response.json().get("participants", [])
#                 print(f"Participants in meeting ID {meeting_id}: {participants}")
#                 for participant in participants:
#                     if participant.get('name') == name_query:
#                         filtered_recordings.append(meeting)
#                         break
#             else:
#                 print(f"Error fetching participants for meeting ID {meeting_id}: {response.status_code}")
#         return filtered_recordings

#     def filter_recordings_by_date(self, recordings, start_date, end_date):
#         print(f"Filtering recordings by date range: {start_date} to {end_date}")
#         filtered_recordings = []
#         for meeting in recordings:
#             meeting_id = meeting['id']
#             url = f"https://api.zoom.us/v2/report/meetings/{meeting_id}/participants"
#             response = requests.get(url, headers={
#                 "Authorization": f"Bearer {self.access_token}"
#             })
#             if response.status_code == 200:
#                 participants = response.json().get("participants", [])
#                 for participant in participants:
#                     participant_join_date = datetime.strptime(participant.get('join_time', '').split('T')[0], '%Y-%m-%d')
#                     if self.is_within_date_range(participant_join_date, start_date, end_date):
#                         filtered_recordings.append(meeting)
#                         break
#             else:
#                 print(f"Error fetching participants for meeting ID {meeting_id}: {response.status_code}")
#         return filtered_recordings

#     def filter_recordings_by_name_and_date(self, name_query, start_date, end_date, recordings):
#         print(f"Filtering recordings by name: {name_query} and date range: {start_date} to {end_date}")
#         filtered_recordings = []
#         for meeting in recordings:
#             meeting_id = meeting['id']
#             url = f"https://api.zoom.us/v2/report/meetings/{meeting_id}/participants"
#             response = requests.get(url, headers={
#                 "Authorization": f"Bearer {self.access_token}"
#             })
#             if response.status_code == 200:
#                 participants = response.json().get("participants", [])
#                 for participant in participants:
#                     participant_join_date = datetime.strptime(participant.get('join_time', '').split('T')[0], '%Y-%m-%d')
#                     if participant.get('name') == name_query and self.is_within_date_range(participant_join_date, start_date, end_date):
#                         filtered_recordings.append(meeting)
#                         break
#             else:
#                 print(f"Error fetching participants for meeting ID {meeting_id}: {response.status_code}")
#         return filtered_recordings
    
#     def filter_recordings_by_transcript(self, recordings, word):
#         matched_meetings = []
#         logging.info(f"Filtering recordings by transcript for word: {word}")

#         for meeting in recordings:
#             meeting_id = meeting['id']
#             logging.info(f"Checking transcript for meeting ID {meeting_id}")
#             transcript_url = self.get_transcript_url(meeting_id)
#             if transcript_url:
#                 transcript = self.download_transcript(transcript_url)
#                 clean_transcript = self.clean_transcript(transcript)
#                 if word.lower() in clean_transcript.lower():
#                     matched_meetings.append(meeting)
#                     logging.info(f"Word '{word}' found in meeting ID {meeting_id}")
#                 else:
#                     logging.info(f"Word '{word}' not found in meeting ID {meeting_id}")
#             else:
#                 logging.info(f"No transcript found for meeting ID {meeting_id}")

#         return matched_meetings

#     def filter_recordings(self, name_query, transcript_query, start_date, end_date):
#         print(f"Filtering recordings with name: {name_query}, start_date: {start_date}, end_date: {end_date}, transcript_query: {transcript_query}")
#         recordings = self.get_recordings().get('meetings', [])
#         filtered_recordings = []

#         if transcript_query and name_query and start_date and end_date:
#             recordings = self.filter_recordings_by_name_and_date(name_query, start_date, end_date, recordings)
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif transcript_query and name_query and start_date:
#             recordings = self.filter_recordings_by_name_and_date(name_query, start_date, datetime.today().strftime('%Y-%m-%d'), recordings)
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif transcript_query and name_query and end_date:
#             recordings = self.filter_recordings_by_name_and_date(name_query, self.default_from_date, end_date, recordings)
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif transcript_query and name_query:
#             recordings = self.filter_recordings_by_name(recordings, name_query)
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif transcript_query and start_date and end_date:
#             recordings = self.filter_recordings_by_date(recordings, start_date, end_date)
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif transcript_query and start_date:
#             recordings = self.filter_recordings_by_date(recordings, start_date, datetime.today().strftime('%Y-%m-%d'))
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif transcript_query and end_date:
#             recordings = self.filter_recordings_by_date(recordings, self.default_from_date, end_date)
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif transcript_query:
#             filtered_recordings = self.filter_recordings_by_transcript(recordings, transcript_query)
#         elif name_query and start_date and end_date:
#             filtered_recordings = self.filter_recordings_by_name_and_date(name_query, start_date, end_date, recordings)
#         elif name_query and start_date:
#             filtered_recordings = self.filter_recordings_by_name_and_date(name_query, start_date, datetime.today().strftime('%Y-%m-%d'), recordings)
#         elif name_query and end_date:
#             filtered_recordings = self.filter_recordings_by_name_and_date(name_query, self.default_from_date, end_date, recordings)
#         elif name_query:
#             filtered_recordings = self.filter_recordings_by_name(recordings, name_query)
#         elif start_date and end_date:
#             filtered_recordings = self.filter_recordings_by_date(recordings, start_date, end_date)
#         elif start_date:
#             filtered_recordings = self.filter_recordings_by_date(recordings, start_date, datetime.today().strftime('%Y-%m-%d'))
#         elif end_date:
#             filtered_recordings = self.filter_recordings_by_date(recordings, self.default_from_date, end_date)
#         else:
#             filtered_recordings = recordings

#         return filtered_recordings

#     def is_within_date_range(self, join_date, start_date, end_date):
#         print(f"Checking if join date: {join_date} is within range: {start_date} to {end_date}")
#         if start_date and join_date < datetime.strptime(start_date, '%Y-%m-%d'):
#             return False
#         if end_date and join_date > datetime.strptime(end_date, '%Y-%m-%d'):
#             return False
#         return True










