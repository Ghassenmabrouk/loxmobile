import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const createTestRide = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const testRide = {
      name: 'John Smith',
      userId: 'test-user-123',
      pickupLocation: {
        coordinates: '40.7128,-74.0060',
        locationName: 'Empire State Building, 350 5th Ave, New York, NY 10118'
      },
      destinations: [
        {
          location: '40.7589,-73.9851',
          destinationName: 'Times Square, Manhattan, New York, NY 10036'
        }
      ],
      pickupDate: tomorrow.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      pickupTime: '10:00 AM',
      passengers: 2,
      carMake: 'Luxury Sedan',
      estimatedPrice: '45.00',
      status: 'pending',
      contact: '+1 (555) 123-4567',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'rides'), testRide);
    console.log('Test ride created with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating test ride:', error);
    return { success: false, error };
  }
};

export const createMultipleTestRides = async (count: number = 3) => {
  const rides = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const testRides = [
    {
      name: 'Sarah Johnson',
      pickupLocation: {
        coordinates: '40.7614,-73.9776',
        locationName: 'Central Park South, New York, NY'
      },
      destinations: [
        {
          location: '40.7831,-73.9712',
          destinationName: 'Museum of Natural History, New York, NY'
        }
      ],
      passengers: 1,
      carMake: 'Premium SUV',
      estimatedPrice: '35.00'
    },
    {
      name: 'Michael Chen',
      pickupLocation: {
        coordinates: '40.7580,-73.9855',
        locationName: 'Broadway & 47th St, New York, NY'
      },
      destinations: [
        {
          location: '40.7484,-73.9857',
          destinationName: 'Madison Square Garden, New York, NY'
        }
      ],
      passengers: 4,
      carMake: 'Luxury Van',
      estimatedPrice: '55.00'
    },
    {
      name: 'Emily Rodriguez',
      pickupLocation: {
        coordinates: '40.7489,-73.9680',
        locationName: 'Grand Central Terminal, New York, NY'
      },
      destinations: [
        {
          location: '40.7614,-73.9776',
          destinationName: 'Plaza Hotel, New York, NY'
        }
      ],
      passengers: 2,
      carMake: 'Executive Sedan',
      estimatedPrice: '40.00'
    }
  ];

  for (let i = 0; i < Math.min(count, testRides.length); i++) {
    const ride = testRides[i];
    try {
      const docRef = await addDoc(collection(db, 'rides'), {
        ...ride,
        userId: `test-user-${i + 1}`,
        pickupDate: tomorrow.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        pickupTime: `${10 + i}:00 AM`,
        status: 'pending',
        contact: `+1 (555) ${100 + i * 11}-${1000 + i * 111}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      rides.push({ success: true, id: docRef.id, name: ride.name });
    } catch (error) {
      rides.push({ success: false, error, name: ride.name });
    }
  }

  return rides;
};
