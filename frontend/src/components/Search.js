import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Search.css';

function Search() {
  const [query, setQuery] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nameNotFound, setNameNotFound] = useState(false);
  const [dateError, setDateError] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [dateNotFoundError, setDateNotFoundError] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (event) => {
    event.preventDefault();
    setNameNotFound(false);
    setDateError('');
    setNameError(false);
    setDateNotFoundError(false);

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('End date cannot be earlier than start date.');
      return;
    }

    let validName = validateName(query);

    if (query && !validName) {
      setNameNotFound(true);
      return;
    }

    try {
      const response = await axios.get('http://127.0.0.1:5000/recordings', {
        params: {
          name_query: query,
          transcript_query: textQuery,
          start_date: startDate,
          end_date: endDate,
        },
      });
      const recordings = response.data.meetings || [];
      if (query && recordings.length === 0) {
        setNameError(true);
        return;
      }
      if ((startDate || endDate) && recordings.length === 0) {
        setDateNotFoundError(true);
        return;
      }
      console.log('Navigating to /recordings with state:', { recordings, query, textQuery, startDate, endDate });
      navigate('/recordings', { state: { recordings, query, textQuery, startDate, endDate } });
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setNameNotFound(true);
    }
  };

  const validateName = (name) => {
    return name.trim() !== '';
  };

  const clearSearch = () => {
    setQuery('');
    setTextQuery('');
    setStartDate('');
    setEndDate('');
    setDateError('');
    setNameError(false);
    setDateNotFoundError(false);
    setNameNotFound(false);
    setAdvancedSearch(false);
  };

  return (
    <div className="Search">
      <h1 className="title">Search Zoom Recordings</h1>
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by name"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNameError(false);
                console.log('Query input changed:', e.target.value);
              }}
              className={`search-input ${nameError ? 'error' : ''}`}
            />
            {query && <button type="button" className="clear-button" onClick={() => setQuery('')}>×</button>}
            {nameError && (
              <div className="error-message">
                <img src="/error.png" alt="Error" />
                Participant not found.
              </div>
            )}
          </div>
          <button type="submit" className="search-button">Search</button>
          <button type="button" className="filter-button" onClick={() => setAdvancedSearch(!advancedSearch)}>
            <img src="/filter.png" alt="Filter" className="filter-icon" />
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
                <img src="/error-icon.png" alt="Error" />
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
    </div>
  );
}

export default Search;