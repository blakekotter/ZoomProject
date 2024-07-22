import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Search from './components/Search';
import Recordings from './components/Recordings';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/recordings" element={<Recordings />} />
      </Routes>
    </div>
  );
};

export default App;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import './App.css';

// function App() {
//   const [recordings, setRecordings] = useState([]);
//   const [transcripts, setTranscripts] = useState({});
//   const [query, setQuery] = useState('');

//   useEffect(() => {
//     fetchRecordings('');
//   }, []);

//   const fetchRecordings = (searchQuery) => {
//     axios.get(`http://127.0.0.1:5000/recordings?query=${searchQuery}`)
//       .then(response => {
//         setRecordings(response.data.meetings || []);
//       })
//       .catch(error => {
//         console.error('Error fetching recordings:', error);
//       });
//   };

//   const handleSearch = (event) => {
//     event.preventDefault();
//     fetchRecordings(query);
//   };

//   const fetchTranscript = (meetingId) => {
//     axios.get(`http://127.0.0.1:5000/transcript?meeting_id=${meetingId}`)
//       .then(response => {
//         setTranscripts(prevTranscripts => ({
//           ...prevTranscripts,
//           [meetingId]: response.data.transcript || 'No transcript available'
//         }));
//       })
//       .catch(error => {
//         console.error('Error fetching transcript:', error);
//       });
//   };

//   const copyTranscript = (transcript) => {
//     navigator.clipboard.writeText(transcript).then(() => {
//       alert('Transcript copied to clipboard');
//     }).catch(err => {
//       console.error('Error copying transcript:', err);
//     });
//   };

//   const downloadTranscript = (filename, transcript) => {
//     const element = document.createElement("a");
//     const file = new Blob([transcript], { type: 'text/plain' });
//     element.href = URL.createObjectURL(file);
//     element.download = filename;
//     document.body.appendChild(element);
//     element.click();
//   };

//   const formatDateTime = (dateTime) => {
//     const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
//     return new Date(dateTime).toLocaleString(undefined, options);
//   };

//   return (
//     <div className="App">
//       <h1>Zoom Recordings</h1>
//       <form onSubmit={handleSearch}>
//         <input
//           type="text"
//           placeholder="Search by sales rep email"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//         />
//         <button type="submit">Search</button>
//       </form>
//       <ul>
//         {recordings.map(recording => (
//           <li key={recording.id}>
//             <div><strong>Title:</strong> {recording.topic}</div>
//             <div><strong>Meeting ID:</strong> {recording.id}</div>
//             <div><strong>Date/Time:</strong> {formatDateTime(recording.start_time)}</div>
//             <button onClick={() => fetchTranscript(recording.id)}>
//               Get Transcript
//             </button>
//             {transcripts[recording.id] && (
//               <div className="transcript-container">
//                 <div className="transcript-buttons">
//                   <button onClick={() => copyTranscript(transcripts[recording.id])}>
//                     <img src="/path/to/copy-icon.png" alt="Copy" />
//                   </button>
//                   <button onClick={() => downloadTranscript(`transcript_${recording.id}.txt`, transcripts[recording.id])}>
//                     <img src="/path/to/download-icon.png" alt="Download" />
//                   </button>
//                 </div>
//                 <pre className="transcript">{transcripts[recording.id]}</pre>
//               </div>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default App;










// 
// 
// // import React, { useState } from 'react';
// import './App.css';
// import axios from 'axios';

// function App() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [advancedSearch, setAdvancedSearch] = useState(false);
//   const [transcriptQuery, setTranscriptQuery] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [meetingID, setMeetingID] = useState('');
//   const [recordings, setRecordings] = useState([]);
//   const [showResults, setShowResults] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [showTranscript, setShowTranscript] = useState(false);

//   const handleSearch = async (event) => {
//     event.preventDefault();
//     if (!validateEmail(searchQuery)) {
//       alert('Please enter a valid email address.');
//       return;
//     }

//     if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
//       alert('Start date cannot be after end date.');
//       return;
//     }

//     try {
//       const response = await axios.get('http://127.0.0.1:5000/recordings', {
//         params: {
//           email_query: searchQuery,
//           transcript_query: transcriptQuery,
//           start_date: startDate,
//           end_date: endDate,
//           meeting_id: meetingID,
//           page: 1,
//           page_size: 100
//         }
//       });
//       setRecordings(response.data.meetings || response.data);
//       setShowResults(true);
//     } catch (error) {
//       console.error('Error fetching recordings:', error);
//     }
//   };

//   const handleTranscript = async (meetingID) => {
//     try {
//       const response = await axios.get('http://127.0.0.1:5000/transcript', {
//         params: { meeting_id: meetingID }
//       });
//       setTranscript(response.data.transcript);
//       setShowTranscript(true);
//     } catch (error) {
//       console.error('Error fetching transcript:', error);
//     }
//   };

//   const validateEmail = (email) => {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(String(email).toLowerCase());
//   };

//   const toggleAdvancedSearch = () => {
//     setAdvancedSearch(!advancedSearch);
//   };

//   const clearSearch = () => {
//     setSearchQuery('');
//     setTranscriptQuery('');
//     setStartDate('');
//     setEndDate('');
//     setMeetingID('');
//   };

//   const handleDownload = () => {
//     const element = document.createElement('a');
//     const file = new Blob([transcript], { type: 'text/plain' });
//     element.href = URL.createObjectURL(file);
//     element.download = 'transcript.txt';
//     document.body.appendChild(element); // Required for this to work in FireFox
//     element.click();
//   };

//   const handleCopy = () => {
//     navigator.clipboard.writeText(transcript);
//   };

//   return (
//     <div className="App">
//       <h1>Zoom Recordings Search</h1>
//       <form onSubmit={handleSearch} className="search-form">
//         <div className="search-input-container">
//           <i className="fas fa-search search-input-icon"></i>
//           <input
//             type="text"
//             placeholder="Search by email or participant"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="search-input"
//           />
//           {searchQuery && (
//             <i className="fas fa-times search-input-clear" onClick={() => setSearchQuery('')}></i>
//           )}
//         </div>
//         <div className="advanced-search-toggle" onClick={toggleAdvancedSearch}>
//           Advanced Search {advancedSearch ? '▲' : '▼'}
//         </div>
//         {advancedSearch && (
//           <div className="advanced-search">
//             <div className="search-field">
//               <input
//                 type="text"
//                 placeholder="Search by Topic or Meeting ID"
//                 value={meetingID}
//                 onChange={(e) => setMeetingID(e.target.value)}
//                 className="search-input"
//               />
//               {meetingID && (
//                 <i className="fas fa-times search-input-clear" onClick={() => setMeetingID('')}></i>
//               )}
//             </div>
//             <div className="search-field">
//               <input
//                 type="text"
//                 placeholder="Search text in audio transcript"
//                 value={transcriptQuery}
//                 onChange={(e) => setTranscriptQuery(e.target.value)}
//                 className="search-input"
//               />
//               {transcriptQuery && (
//                 <i className="fas fa-times search-input-clear" onClick={() => setTranscriptQuery('')}></i>
//               )}
//             </div>
//             <div className="date-field">
//               <label>From</label>
//               <div className="date-input-container">
//                 <input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="search-input"
//                 />
//                 {startDate && (
//                   <i className="fas fa-times search-input-clear" onClick={() => setStartDate('')}></i>
//                 )}
//               </div>
//               <label>To</label>
//               <div className="date-input-container">
//                 <input
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="search-input"
//                 />
//                 {endDate && (
//                   <i className="fas fa-times search-input-clear" onClick={() => setEndDate('')}></i>
//                 )}
//               </div>
//             </div>
//             <button type="submit" className="advanced-search-button">
//               Search
//             </button>
//           </div>
//         )}
//       </form>
//       {showResults && (
//         <div className="results-table">
//           <h2>Recordings</h2>
//           <table>
//             <thead>
//               <tr>
//                 <th>Topic</th>
//                 <th>Meeting ID</th>
//                 <th>Start Time</th>
//                 <th>Transcript</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recordings.map((recording) => (
//                 <tr key={recording.uuid}>
//                   <td>{recording.topic}</td>
//                   <td>{recording.id}</td>
//                   <td>{new Date(recording.start_time).toLocaleString()}</td>
//                   <td>
//                     <button onClick={() => handleTranscript(recording.id)}>View Transcript</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//       {showTranscript && (
//         <div className="transcript-modal">
//           <div className="transcript-content">
//             <h3>Transcript</h3>
//             <pre>{transcript}</pre>
//             <button onClick={handleDownload}>Download</button>
//             <button onClick={handleCopy}>Copy</button>
//             <button onClick={() => setShowTranscript(false)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;