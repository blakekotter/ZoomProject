import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Recordings.css';

function Recordings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordings: initialRecordings, nameQuery: initialNameQuery, startDate: initialStartDate, endDate: initialEndDate, textQuery: initialTextQuery } = location.state || {};
  const [recordings, setRecordings] = useState(initialRecordings || []);
  const [transcripts, setTranscripts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [nameQuery, setNameQuery] = useState(initialNameQuery || '');
  const [textQuery, setTextQuery] = useState(initialTextQuery || '');
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [nameNotFound, setNameNotFound] = useState(false);
  const [dateError, setDateError] = useState('');
  const [textNotFoundError, setTextNotFoundError] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const [nameError, setNameError] = useState(false);
  const [dateNotFoundError, setDateNotFoundError] = useState(false);

  useEffect(() => {
    if (!initialRecordings) {
      fetchRecordings(nameQuery, textQuery, startDate, endDate);
    }
  }, [nameQuery, textQuery, startDate, endDate]);

  const fetchRecordings = (nameQuery, textQuery, startDate, endDate) => {
    console.log('Fetching recordings with nameQuery:', nameQuery, 'textQuery:', textQuery, 'startDate:', startDate, 'endDate:', endDate);
    axios.get('http://127.0.0.1:5000/recordings', {
      params: {
        name_query: nameQuery,
        transcript_query: textQuery,
        start_date: startDate,
        end_date: endDate,
      },
    })
      .then(response => {
        console.log('Recordings fetched:', response.data.meetings);
        setRecordings(response.data.meetings || []);
        if (nameQuery && response.data.meetings.length === 0) {
          setNameError(true);
        }
        if ((startDate || endDate) && response.data.meetings.length === 0) {
          setDateNotFoundError(true);
        }
        if (textQuery && response.data.meetings.length === 0) {
          setTextNotFoundError(true);
        }
      })
      .catch(error => {
        console.error('Error fetching recordings:', error);
        setNameError(true);
        setDateNotFoundError(true);
        setTextNotFoundError(true);
      });
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setNameError(false);
    setDateError('');
    setDateNotFoundError(false);
    setTextNotFoundError(false);

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('End date cannot be earlier than start date.');
      return;
    }

    fetchRecordings(nameQuery, textQuery, startDate, endDate);
  };

  const clearSearch = () => {
    setNameQuery('');
    setTextQuery('');
    setStartDate('');
    setEndDate('');
    setDateError('');
    setNameError(false);
    setDateNotFoundError(false);
    setTextNotFoundError(false);
    setAdvancedSearch(false);
  };

  const fetchTranscript = (meetingId) => {
    console.log('Fetching transcript for meetingId:', meetingId);
    setTranscriptLoading(prevState => ({ ...prevState, [meetingId]: true }));
    axios.get(`http://127.0.0.1:5000/transcript?meeting_id=${meetingId}`)
      .then(response => {
        console.log('Transcript fetched for meetingId:', meetingId, 'Transcript:', response.data.transcript);
        setTranscripts(prevTranscripts => ({
          ...prevTranscripts,
          [meetingId]: response.data.transcript || 'No transcript available'
        }));
        setTranscriptLoading(prevState => ({ ...prevState, [meetingId]: false }));
      })
      .catch(error => {
        console.error('Error fetching transcript for meetingId:', meetingId, error);
        setTranscriptLoading(prevState => ({ ...prevState, [meetingId]: false }));
      });
  };

  const fetchSummary = (meetingId) => {
    console.log('Fetching summary for meetingId:', meetingId);
    setSummaryLoading(prevState => ({ ...prevState, [meetingId]: true }));
    axios.post('http://127.0.0.1:5000/summarize', {
      transcript: transcripts[meetingId]
    })
      .then(response => {
        console.log('Summary fetched for meetingId:', meetingId, 'Summary:', response.data.summary);
        setSummaries(prevSummaries => ({
          ...prevSummaries,
          [meetingId]: response.data.summary || 'No summary available'
        }));
        setSummaryLoading(prevState => ({ ...prevState, [meetingId]: false }));
      })
      .catch(error => {
        console.error('Error fetching summary for meetingId:', meetingId, error);
        setSummaryLoading(prevState => ({ ...prevState, [meetingId]: false }));
      });
  };

  const copyTranscript = (transcript) => {
    console.log('Copying transcript:', transcript);
    navigator.clipboard.writeText(transcript).then(() => {
      const copiedText = document.createElement('div');
      copiedText.className = 'copied-text';
      copiedText.textContent = 'Copied!';
      document.body.appendChild(copiedText);
      setTimeout(() => document.body.removeChild(copiedText), 2000);
    }).catch(err => {
      console.error('Error copying transcript:', err);
    });
  };

  const downloadTranscript = (filename, transcript) => {
    console.log('Downloading transcript:', filename);
    const element = document.createElement("a");
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
  };

  const formatDateTime = (dateTime) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTime).toLocaleString(undefined, options);
  };

  return (
    <div className="Recordings">
      <h1 className="title">Zoom Recordings</h1>
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by name"
              value={nameQuery}
              onChange={(e) => {
                setNameQuery(e.target.value);
                setNameError(false);
                console.log('Name query input changed:', e.target.value);
              }}
              className={`search-input ${nameError ? 'error' : ''}`}
            />
            {nameQuery && <button type="button" className="clear-button" onClick={() => setNameQuery('')}>×</button>}
            {nameError && (
              <div className="error-message">
                <img src="/error.png" alt="Error" />
                Participant not found.
              </div>
            )}
          </div>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search text in audio transcript"
              value={textQuery}
              onChange={(e) => {
                setTextQuery(e.target.value);
                setTextNotFoundError(false);
                console.log('Text query input changed:', e.target.value);
              }}
              className={`search-input ${textNotFoundError ? 'error' : ''}`}
            />
            {textQuery && <button type="button" className="clear-button" onClick={() => setTextQuery('')}>×</button>}
            {textNotFoundError && (
              <div className="error-message">
                <img src="/error.png" alt="Error" />
                No matches found for texts.
              </div>
            )}
          </div>
          <button type="submit" className="search-button">Search</button>
          <button type="button" className="filter-button" onClick={() => setAdvancedSearch(!advancedSearch)}>
            <img src="filter.png" alt="Filter" className="filter-icon" />
            {advancedSearch ? '' : ''}
          </button>
        </div>
        {advancedSearch && (
          <div className="advanced-search">
                        <div className="search-field">
              <label>From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateNotFoundError(false);
                  console.log('Start date changed:', e.target.value);
                }}
                className={`search-input ${dateNotFoundError ? 'error' : ''}`}
              />
              <label>To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateNotFoundError(false);
                  console.log('End date changed:', e.target.value);
                }}
                className={`search-input ${dateNotFoundError ? 'error' : ''}`}
              />
            </div>
            {dateNotFoundError && (
              <div className="error-message">
                <img src="/error.png" alt="Error" />
                No recordings found for the selected date range.
              </div>
            )}
            <button type="button" className="clear-search-button" onClick={clearSearch}>
              Clear Filters
            </button>
          </div>
        )}
      </form>
      {dateError && <div className="error-message">{dateError}</div>}
      
      <table className="recordings-table">
        <thead>
          <tr>
            <th>Topic</th>
            <th>ID</th>
            <th>Start Time</th>
            <th>Transcript</th>
          </tr>
        </thead>
        <tbody>
          {recordings.map(recording => (
            <React.Fragment key={recording.id}>
              <tr className="recording-item">
                <td>{recording.topic}</td>
                <td>{recording.id}</td>
                <td>{new Date(recording.start_time).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => fetchTranscript(recording.id)}
                    className="transcript-button"
                  >
                    {transcriptLoading[recording.id] ? 'Loading...' : 'Get Transcript'}
                  </button>
                </td>
              </tr>
              {transcripts[recording.id] && (
                <tr className="recording-item">
                  <td colSpan="4">
                    <div className="transcript-container">
                      <div className="transcript-buttons">
                        <button
                          onClick={() => copyTranscript(transcripts[recording.id])}
                          className="copy-button"
                        >
                          <img src="/copy.png" alt="Copy" />
                        </button>
                        <button
                          onClick={() => downloadTranscript(`transcript_${recording.id}.txt`, transcripts[recording.id])}
                          className="download-button"
                        >
                          <img src="/download.png" alt="Download" />
                        </button>
                        <button
                          onClick={() => setTranscripts(prev => ({ ...prev, [recording.id]: '' }))}
                          className="close-button"
                        >
                          <img src="/x.png" alt="Close" />
                        </button>
                        {/* <button
                          onClick={() => fetchSummary(recording.id)}
                          className="summary-button"
                        >
                          {summaryLoading[recording.id] ? 'Summarizing...' : 'Get AI Summary'}
                        </button> */}
                      </div>
                      <pre className="transcript">{transcripts[recording.id]}</pre>
                      {summaries[recording.id] && (
                        <div className="summary">
                          <h3>AI Summary:</h3>
                          <p>{summaries[recording.id]}</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Recordings;










// import React, { useEffect, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import '../styles/Recordings.css';

// function Recordings() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { recordings: initialRecordings, nameQuery: initialNameQuery, startDate: initialStartDate, endDate: initialEndDate, textQuery: initialTextQuery } = location.state || {};
//   const [recordings, setRecordings] = useState(initialRecordings || []);
//   const [transcripts, setTranscripts] = useState({});
//   const [summaries, setSummaries] = useState({});
//   const [nameQuery, setNameQuery] = useState(initialNameQuery || '');
//   const [textQuery, setTextQuery] = useState(initialTextQuery || '');
//   const [startDate, setStartDate] = useState(initialStartDate || '');
//   const [endDate, setEndDate] = useState(initialEndDate || '');
//   const [nameNotFound, setNameNotFound] = useState(false);
//   const [advancedSearch, setAdvancedSearch] = useState(false);
//   const [dateError, setDateError] = useState('');
//   const [transcriptLoading, setTranscriptLoading] = useState({});
//   const [summaryLoading, setSummaryLoading] = useState({});

//   useEffect(() => {
//     if (!initialRecordings) {
//       fetchRecordings(nameQuery, textQuery, startDate, endDate);
//     }
//   }, [nameQuery, textQuery, startDate, endDate]);

//   const fetchRecordings = (nameQuery, textQuery, startDate, endDate) => {
//     console.log('Fetching recordings with nameQuery:', nameQuery, 'textQuery:', textQuery, 'startDate:', startDate, 'endDate:', endDate);
//     axios.get('http://127.0.0.1:5000/recordings', {
//       params: {
//         name_query: nameQuery,
//         transcript_query: textQuery,
//         start_date: startDate,
//         end_date: endDate,
//       },
//     })
//       .then(response => {
//         console.log('Recordings fetched:', response.data.meetings);
//         setRecordings(response.data.meetings || []);
//       })
//       .catch(error => {
//         console.error('Error fetching recordings:', error);
//       });
//   };

//   const handleSearch = async (event) => {
//     event.preventDefault();
//     setNameNotFound(false);
//     setDateError('');

//     if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
//       setDateError('End date cannot be earlier than start date.');
//       return;
//     }

//     let validName = validateName(nameQuery);

//     if (nameQuery && !validName) {
//       setNameNotFound(true);
//       return;
//     }

//     fetchRecordings(nameQuery, textQuery, startDate, endDate);
//   };

//   const validateName = (name) => {
//     return name.trim() !== '';
//   };

//   const clearSearch = () => {
//     setNameQuery('');
//     setTextQuery('');
//     setStartDate('');
//     setEndDate('');
//     setDateError('');
//   };

//   const fetchTranscript = (meetingId) => {
//     console.log('Fetching transcript for meetingId:', meetingId);
//     setTranscriptLoading(prevState => ({ ...prevState, [meetingId]: true }));
//     axios.get(`http://127.0.0.1:5000/transcript?meeting_id=${meetingId}`)
//       .then(response => {
//         console.log('Transcript fetched for meetingId:', meetingId, 'Transcript:', response.data.transcript);
//         setTranscripts(prevTranscripts => ({
//           ...prevTranscripts,
//           [meetingId]: response.data.transcript || 'No transcript available'
//         }));
//         setTranscriptLoading(prevState => ({ ...prevState, [meetingId]: false }));
//       })
//       .catch(error => {
//         console.error('Error fetching transcript for meetingId:', meetingId, error);
//         setTranscriptLoading(prevState => ({ ...prevState, [meetingId]: false }));
//       });
//   };

//   const fetchSummary = (meetingId) => {
//     console.log('Fetching summary for meetingId:', meetingId);
//     setSummaryLoading(prevState => ({ ...prevState, [meetingId]: true }));
//     axios.post('http://127.0.0.1:5000/summarize', {
//       transcript: transcripts[meetingId]
//     })
//       .then(response => {
//         console.log('Summary fetched for meetingId:', meetingId, 'Summary:', response.data.summary);
//         setSummaries(prevSummaries => ({
//           ...prevSummaries,
//           [meetingId]: response.data.summary || 'No summary available'
//         }));
//         setSummaryLoading(prevState => ({ ...prevState, [meetingId]: false }));
//       })
//       .catch(error => {
//         console.error('Error fetching summary for meetingId:', meetingId, error);
//         setSummaryLoading(prevState => ({ ...prevState, [meetingId]: false }));
//       });
//   };

//   const copyTranscript = (transcript) => {
//     console.log('Copying transcript:', transcript);
//     navigator.clipboard.writeText(transcript).then(() => {
//       const copiedText = document.createElement('div');
//       copiedText.className = 'copied-text';
//       copiedText.textContent = 'Copied!';
//       document.body.appendChild(copiedText);
//       setTimeout(() => document.body.removeChild(copiedText), 2000);
//     }).catch(err => {
//       console.error('Error copying transcript:', err);
//     });
//   };

//   const downloadTranscript = (filename, transcript) => {
//     console.log('Downloading transcript:', filename);
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
//     <div className="Recordings">
//       <h1 className="title">Zoom Recordings</h1>
//       <form onSubmit={handleSearch} className="search-form">
//         <div className="search-bar">
//           <div className="search-input-wrapper">
//             <input
//               type="text"
//               placeholder="Search by name"
//               value={nameQuery}
//               onChange={(e) => {
//                 setNameQuery(e.target.value);
//                 console.log('Query input changed:', e.target.value);
//               }}
//               className="search-input"
//             />
//             {nameQuery && <button type="button" className="clear-button" onClick={() => setNameQuery('')}>×</button>}
//           </div>
//           <div className="search-input-wrapper">
//             <input
//               type="text"
//               placeholder="Search text in
//               audio transcript"
//               value={textQuery}
//               onChange={(e) => {
//                 setTextQuery(e.target.value);
//                 console.log('Text query input changed:', e.target.value);
//               }}
//               className="search-input"
//             />
//             {textQuery && <button type="button" className="clear-button" onClick={() => setTextQuery('')}>×</button>}
//           </div>
//           <button type="submit" className="search-button">Search</button>
//         </div>
//         <div className="advanced-search-toggle" onClick={() => {
//           setAdvancedSearch(!advancedSearch);
//           console.log('Advanced search toggled:', !advancedSearch);
//         }}>
//           Advanced Search {advancedSearch ? '▲' : '▼'}
//         </div>
//         {advancedSearch && (
//           <div className="advanced-search">
//             <div className="search-field">
//               <label>From</label>
//               <input
//                 type="date"
//                 value={startDate}
//                 onChange={(e) => {
//                   setStartDate(e.target.value);
//                   console.log('Start date changed:', e.target.value);
//                 }}
//                 className="search-input"
//               />
//               <label>To</label>
//               <input
//                 type="date"
//                 value={endDate}
//                 onChange={(e) => {
//                   setEndDate(e.target.value);
//                   console.log('End date changed:', e.target.value);
//                 }}
//                 className="search-input"
//               />
//             </div>
//           </div>
//         )}
//       </form>
//       {dateError && <div className="error-message">{dateError}</div>}

//       <table className="recordings-table">
//         <thead>
//           <tr>
//             <th>Topic</th>
//             <th>ID</th>
//             <th>Start Time</th>
//             <th>Transcript</th>
//           </tr>
//         </thead>
//         <tbody>
//           {recordings.map(recording => (
//             <React.Fragment key={recording.id}>
//               <tr className="recording-item">
//                 <td>{recording.topic}</td>
//                 <td>{recording.id}</td>
//                 <td>{new Date(recording.start_time).toLocaleString()}</td>
//                 <td>
//                   <button
//                     onClick={() => fetchTranscript(recording.id)}
//                     className="transcript-button"
//                   >
//                     {transcriptLoading[recording.id] ? 'Loading...' : 'Get Transcript'}
//                   </button>
//                 </td>
//               </tr>
//               {transcripts[recording.id] && (
//                 <tr className="recording-item">
//                   <td colSpan="4">
//                     <div className="transcript-container">
//                       <div className="transcript-buttons">
//                         <button
//                           onClick={() => copyTranscript(transcripts[recording.id])}
//                           className="copy-button"
//                         >
//                           <img src="/copy.png" alt="Copy" />
//                         </button>
//                         <button
//                           onClick={() => downloadTranscript(`transcript_${recording.id}.txt`, transcripts[recording.id])}
//                           className="download-button"
//                         >
//                           <img src="/download.png" alt="Download" />
//                         </button>
//                         <button
//                           onClick={() => setTranscripts(prev => ({ ...prev, [recording.id]: '' }))}
//                           className="close-button"
//                         >
//                           <img src="/x.png" alt="Close" />
//                         </button>
                        
//                       </div>
//                       <pre className="transcript">{transcripts[recording.id]}</pre>
//                       {summaries[recording.id] && (
//                         <div className="summary">
//                           <h3>AI Summary:</h3>
//                           <p>{summaries[recording.id]}</p>
//                         </div>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </React.Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default Recordings;



