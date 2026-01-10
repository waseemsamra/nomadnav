export const mockFlights = [
  {
    id: 'FL001',
    airline: 'Nomad Air',
    from: 'JFK',
    to: 'CDG',
    departureTime: '08:00',
    arrivalTime: '20:00',
    duration: '8h 00m',
    price: 650,
    stops: 'Non-stop',
  },
  {
    id: 'FL002',
    airline: 'Sky High',
    from: 'JFK',
    to: 'CDG',
    departureTime: '10:30',
    arrivalTime: '23:50',
    duration: '9h 20m',
    price: 580,
    stops: '1 Stop (LHR)',
  },
];

export const mockHotels = [
  {
    id: 'HTL001',
    name: 'The Parisian Dream',
    rating: 4.5,
    reviews: 1200,
    pricePerNight: 250,
    amenities: ['Free WiFi', 'Pool', 'Gym'],
    imageId: 'hotel-1',
  },
  {
    id: 'HTL002',
    name: 'Eiffel Tower View Suites',
    rating: 4.8,
    reviews: 850,
    pricePerNight: 450,
    amenities: ['Free WiFi', 'Spa', 'Restaurant'],
    imageId: 'hotel-2',
  },
];

export const mockUser = {
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  preferences: 'Prefers window seats on flights and hotels with a gym.',
};

export const mockBookingHistory = [
  {
    id: 'BK001',
    type: 'Flight',
    details: 'Nomad Air: JFK to LHR',
    date: '2023-10-15',
    status: 'Completed',
    price: 550,
  },
  {
    id: 'BK002',
    type: 'Hotel',
    details: 'The Londoner, 3 nights',
    date: '2023-10-15',
    status: 'Completed',
    price: 900,
  },
    {
    id: 'BK003',
    type: 'Flight',
    details: 'Sky High: SFO to TYO',
    date: '2024-03-20',
    status: 'Upcoming',
    price: 1200,
  },
];
