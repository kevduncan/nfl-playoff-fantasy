import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export type Entry = {
  id: string;
  teamName: string;
  venmo: string;
  email: string;
  players: string[];
  poolYear: string;
  lastUpdated: firebase.firestore.Timestamp;
  formValues: { [key: string]: string };
};
