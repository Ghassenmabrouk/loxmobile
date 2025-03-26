// app/types/ride.ts
export interface LocationCoords {
    latitude: number;
    longitude: number;
  }
  
  export interface RideDestination {
    location: string; // "lat,lng" format
    destinationName?: string;
    stoppingTime?: number;
  }
  
  export interface RideCreateData {
    pickupLocation: {
      coordinates: string; // "lat,lng"
      locationName?: string;
    };
    destinations: RideDestination[];
    pickupDate: string; // ISO format
    carMake: string;
    passengers?: number;
    specialRequests?: string;
  }
  
  export interface Ride extends RideCreateData {
    id: string;
    userId: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: string;
    driverDetails?: {
      idCard: string;
      name: string;
      car: {
        model: string;
        licensePlate: string;
      };
    };
  }
  
  export interface LuxuryCar {
    id: string;
    name: string;
    image: string;
    pricePerKm: number;
    eta: string;
  }