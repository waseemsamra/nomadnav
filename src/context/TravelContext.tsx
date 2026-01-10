
'use client';
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Flight, Hotel, FlightSearchParams, SearchFormData } from '../types/travel';

interface TravelContextType {
  // State
  searchResults: Flight[] | null;
  hotelResults: Hotel[] | null;
  selectedFlight: Flight | null;
  selectedHotel: Hotel | null;
  loading: boolean;
  searchHistory: FlightSearchParams[];
  recentSearches: SearchFormData[];
  
  // Actions
  setSearchResults: (results: Flight[] | null) => void;
  setHotelResults: (results: Hotel[] | null) => void;
  setSelectedFlight: (flight: Flight | null) => void;
  setSelectedHotel: (hotel: Hotel | null) => void;
  setLoading: (loading: boolean) => void;
  addToHistory: (search: FlightSearchParams) => void;
  addToRecentSearches: (search: SearchFormData) => void;
  clearHistory: () => void;
  clearResults: () => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const useTravel = (): TravelContextType => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravel must be used within TravelProvider');
  }
  return context;
};

interface TravelProviderProps {
  children: ReactNode;
}

export const TravelProvider: React.FC<TravelProviderProps> = ({ children }) => {
  const [searchResults, setSearchResults] = useState<Flight[] | null>(null);
  const [hotelResults, setHotelResults] = useState<Hotel[] | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<FlightSearchParams[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchFormData[]>([]);

  const addToHistory = useCallback((search: FlightSearchParams) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(s => 
        !(s.origin === search.origin && 
          s.destination === search.destination && 
          s.depart_date === search.depart_date)
      );
      return [search, ...filtered.slice(0, 9)];
    });
  }, []);

  const addToRecentSearches = useCallback((search: SearchFormData) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => 
        !(s.origin === search.origin && 
          s.destination === search.destination)
      );
      return [search, ...filtered.slice(0, 4)];
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setHotelResults(null);
    setSelectedFlight(null);
    setSelectedHotel(null);
  }, []);

  const value: TravelContextType = {
    searchResults,
    hotelResults,
    selectedFlight,
    selectedHotel,
    loading,
    searchHistory,
    recentSearches,
    setSearchResults,
    setHotelResults,
    setSelectedFlight,
    setSelectedHotel,
    setLoading,
    addToHistory,
    addToRecentSearches,
    clearHistory,
    clearResults,
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};
