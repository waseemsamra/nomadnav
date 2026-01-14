
'use client';
import React from 'react';
import { type Flight } from '@/services/travelpayoutsApi';
import { OTA_DATA } from '@/lib/ota-data';
import { ALLIANCE_DATA } from '@/lib/alliance-data';

interface FlightCardProps {
  flight: Flight;
  onBookFlight: (flight: Flight) => void;
}

const getOtaInfo = (code: string | undefined) => {
    if (!code) return { name: 'Unknown', code: 'UNKNOWN' };
    const ota = OTA_DATA.find(o => o.code === code);
    return ota ? { name: ota.name, code: ota.code } : { name: code, code };
};

const getAirlineName = (code: string | undefined) => {
    if (!code) return 'Unknown Airline';
    
    // Simple mock data for airline names, can be expanded
    const MOCK_AIRLINE_NAMES: { [key:string]: string} = {
        'G9': 'Air Arabia',
        'EK': 'Emirates',
        'QR': 'Qatar Airways',
    };
    if (MOCK_AIRLINE_NAMES[code]) return MOCK_AIRLINE_NAMES[code];
    
    // A real implementation might search a larger local dataset or use the API response's airline name
    return code;
}

const formatDateTime = (dateString: string | undefined) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateString;
    }
};

const formatDuration = (minutes: number | undefined) => {
    if (minutes === undefined || isNaN(minutes)) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
};


const FlightCard: React.FC<FlightCardProps> = ({ flight, onBookFlight }) => {
    const price = flight.price || 'N/A';
    const airlineCode = flight.airline_code || flight.airline;
    const airlineName = flight.airline || getAirlineName(airlineCode);
    const ota = getOtaInfo(flight.gate);
    const origin = flight.origin || '???';
    const destination = flight.destination || '???';
    const stops = flight.transfers ?? 0;
    const departure = flight.departure_at || 'N/A';
    const duration = flight.duration;
    const link = flight.link || '#';

    return (
      <div className="flight-card" data-price={price} data-stops={stops} data-duration={duration}>
        <div className="card-header">
          <div className="price-section">
            <span className="price">${price}</span>
            <span className="per-person">per person</span>
          </div>
          <div className="ota-section">
            <img 
                 src={`https://pics.avs.io/40/40/${ota.code}.png`} 
                 alt={ota.name}
                 className="ota-logo"
                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40/cccccc/666666?text=OTA' }}/>
            <span className="ota-name">{ota.name}</span>
          </div>
        </div>
        
        <div className="card-body">
          <div className="route">
            <div className="city">{origin}</div>
            <div className="arrow">→</div>
            <div className="city">{destination}</div>
          </div>
          
          <div className="details">
            <div className="detail-item">
              <span className="label">Airline:</span>
              <span className="value">{airlineName}</span>
            </div>
            <div className="detail-item">
              <span className="label">Departure:</span>
              <span className="value">{formatDateTime(departure)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Duration:</span>
              <span className="value">{formatDuration(duration)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Stops:</span>
              <span className="value">{stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}</span>
            </div>
          </div>
        </div>
        
        <div className="card-footer">
          <a href={link} 
             target="_blank" 
             rel="noopener noreferrer"
             className="book-button"
             onClick={() => onBookFlight(flight)}>
            Select Flight
          </a>
          <button className="details-button" onClick={() => alert('Flight details feature coming soon!')}>
            Details
          </button>
        </div>
      </div>
    );
};

export default FlightCard;
