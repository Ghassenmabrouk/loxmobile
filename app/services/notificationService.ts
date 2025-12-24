import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Alert } from 'react-native';

export interface DriverArrivedNotification {
  rideId: string;
  driverName: string;
  driverPhoto?: string;
  carModel: string;
  licensePlate: string;
  carClass: string;
}

export class NotificationService {
  static subscribeToRideUpdates(userId: string, onDriverArrived: (notification: DriverArrivedNotification) => void) {
    const ridesRef = collection(db, 'rides');
    const userRidesQuery = query(
      ridesRef,
      where('userId', '==', userId),
      where('status', 'in', ['accepted', 'driver-arrived', 'in-progress'])
    );

    const unsubscribe = onSnapshot(userRidesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const ride = change.doc.data();

          if (ride.status === 'driver-arrived') {
            const notification: DriverArrivedNotification = {
              rideId: change.doc.id,
              driverName: ride.driverDetails?.name || 'Your driver',
              driverPhoto: ride.driverDetails?.photo,
              carModel: ride.driverDetails?.car?.model || 'Unknown',
              licensePlate: ride.driverDetails?.car?.licensePlate || 'N/A',
              carClass: ride.driverDetails?.car?.class || 'Standard',
            };

            onDriverArrived(notification);
          }
        }
      });
    });

    return unsubscribe;
  }

  static showDriverArrivedAlert(notification: DriverArrivedNotification) {
    Alert.alert(
      'Your Driver Has Arrived!',
      `${notification.driverName} is here to pick you up.\n\n` +
      `Vehicle: ${notification.carModel}\n` +
      `License Plate: ${notification.licensePlate}\n` +
      `Class: ${notification.carClass}`,
      [
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  }
}
