import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getDayOfWeek } from '@/utils/getDayOfWeek';
import { useUserStore } from '@/store/userStore';
import { useEffect, useState } from 'react';
import { DailyLog } from '@/types/history';

export const useHistoryData = () => {
  const { user } = useUserStore();
  const [history, setHistory] = useState<DailyLog | null>(null);

  useEffect(() => {
    // Fetch last user historic data from Firestore
    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      getDoc(userDoc).then((doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const history = userData.history;
          const today = getDayOfWeek();
          const todayHistory = history[today];
          if (todayHistory) {
            setHistory(todayHistory);
          }
        }
      });
    }
  }, []);

  return { history };
};
