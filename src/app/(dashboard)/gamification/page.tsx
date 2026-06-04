'use client';

import { gamificationApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Zap, Target, Crown, Gamepad2, TrendingUp } from 'lucide-react';

export default function GamificationPage() {
  const { currentSchool, user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);

  const demoBadges = [
    { id: '1', name: 'Perfect Attendance', description: 'Attended all classes for a full term', color: '#FFD700', iconUrl: '', criteriaType: 'ATTENDANCE_STREAK', pointsValue: 50, earned: true },
    { id: '2', name: 'Math Whiz', description: 'Scored 90+ in Mathematics', color: '#6366F1', iconUrl: '', criteriaType: 'GRADE_AVERAGE', pointsValue: 30, earned: true },
    { id: '3', name: 'Quiz Master', description: 'Completed 10 quizzes with 80%+', color: '#10B981', iconUrl: '', criteriaType: 'QUIZ_SCORE', pointsValue: 40, earned: false },
    { id: '4', name: 'Bookworm', description: 'Read 5 books from the library', color: '#F59E0B', iconUrl: '', criteriaType: 'CONTENT_COMPLETED', pointsValue: 25, earned: false },
    { id: '5', name: 'Early Bird', description: 'Submitted all assignments on time', color: '#EC4899', iconUrl: '', criteriaType: 'ASSIGNMENTS_ON_TIME', pointsValue: 20, earned: true },
  ];

  const demoLeaderboard = [
    { userId: '1', fullName: 'Chioma Obi', avatarUrl: '', totalPoints: 1250, badgesCount: 5, rank: 1 },
    { userId: '2', fullName: 'Ade Johnson', avatarUrl: '', totalPoints: 980, badgesCount: 4, rank: 2 },
    { userId: '3', fullName: 'David Lee', avatarUrl: '', totalPoints: 875, badgesCount: 3, rank: 3 },
    { userId: '4', fullName: 'Blessing Eze', avatarUrl: '', totalPoints: 720, badgesCount: 3, rank: 4 },
    { userId: '5', fullName: 'Chinedu Okoro', avatarUrl: '', totalPoints: 650, badgesCount: 2, rank: 5 },
  ];

  useEffect(() => {
    if (currentSchool?.id) {
      gamificationApi.getLeaderboard(currentSchool.id, 20).then((r) => {
        setLeaderboard(r.data?.length ? r.data : demoLeaderboard);
      }).catch(() => setLeaderboard(demoLeaderboard));
      setBadges(demoBadges);
      setUserPoints(980);
    }
  }, [currentSchool]);

  const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700', 'text-slate-500', 'text-slate-500'];

  return (
    <div className="space-y-6" data-tour="gamification">
      <h1 className="text-2xl font-bold gradient-text">Achievements & Leaderboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{userPoints}</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Total Points</p>
        </div>
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <Medal className="w-6 h-6 text-primary-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{badges.filter((b) => b.earned).length}</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Badges Earned</p>
        </div>
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <Target className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{badges.length - badges.filter((b) => b.earned).length}</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Badges to Unlock</p>
        </div>
        <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">#{leaderboard.findIndex((e) => e.userId === user?.id) + 1 || '?'}</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Your Rank</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-xl text-center transition-all ${
                  badge.earned
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800/30'
                    : 'bg-slate-50 dark:bg-slate-800/30 opacity-60'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: badge.earned ? badge.color + '30' : '#e2e8f0' }}
                >
                  <Medal className="w-5 h-5" style={{ color: badge.earned ? badge.color : '#94a3b8' }} />
                </div>
                <p className="text-xs font-medium truncate">{badge.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">+{badge.pointsValue} pts</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-500" /> Leaderboard
          </h2>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  i < 3 ? 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10' : 'hover:bg-white/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-slate-200 text-slate-700' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {entry.fullName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.fullName}</p>
                  <p className="text-[10px] text-slate-500">{entry.badgesCount} badges</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">{entry.totalPoints}</p>
                  <p className="text-[10px] text-slate-500">pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
