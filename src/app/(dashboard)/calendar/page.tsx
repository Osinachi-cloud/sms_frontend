'use client';

import { eventApi, announcementApi, holidayApi } from '@/lib/api';
import { normalizeListResponse } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight, Plus, Pin, Megaphone, Sun } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Holiday {
  id: string;
  name: string;
  date: string;
  holidayType: string;
  description?: string;
}

export default function CalendarPage() {
  const { currentSchool } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', location: '', startDate: '', eventType: 'GENERAL' });

  useEffect(() => {
    if (currentSchool?.id) {
      eventApi.getUpcoming(currentSchool.id).then((r) => setEvents(normalizeListResponse<any>(r.data).items));
      announcementApi.getActive(currentSchool.id).then((r) => setAnnouncements(normalizeListResponse<any>(r.data).items));
      holidayApi.getAll(currentSchool.id).then((r) => setHolidays(normalizeListResponse<Holiday>(r.data).items));
    }
  }, [currentSchool]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const eventsForDate = (d: number) =>
    events.filter((e) => {
      const ed = new Date(e.startDate);
      return ed.getDate() === d && ed.getMonth() === month && ed.getFullYear() === year;
    });

  const holidaysForDate = (d: number) =>
    holidays.filter((h) => {
      const hd = new Date(h.date);
      return hd.getDate() === d && hd.getMonth() === month && hd.getFullYear() === year;
    });

  const getHolidayColorClass = (type: string) => {
    switch (type) {
      case 'PUBLIC_HOLIDAY':
        return 'bg-red-500';
      case 'SCHOOL_EVENT':
        return 'bg-blue-500';
      default:
        return 'bg-amber-500';
    }
  };

  const createEvent = async () => {
    if (!currentSchool?.id) return;
    const data = { ...newEvent, startDate: new Date(newEvent.startDate).toISOString() };
    await eventApi.create(currentSchool.id, data);
    setShowModal(false);
    eventApi.getUpcoming(currentSchool.id).then((r) => setEvents(r.data?.content || []));
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="calendar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">School Calendar</h1>
        <Button onClick={() => setShowModal(true)} className="self-start">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{monthNames[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Holiday</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> School Event</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-500" /> Event</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-medium text-slate-500 mb-2">
            {dayNames.map((d) => (
              <div key={d} className="py-1 sm:py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dayHolidays = day ? holidaysForDate(day) : [];
              const dayEvents = day ? eventsForDate(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm cursor-pointer transition-colors relative ${
                    day === null ? '' : 'hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  } ${
                    isToday ? 'bg-primary-100 dark:bg-primary-900/30 font-bold text-primary-700 dark:text-primary-400' : ''
                  } ${
                    isSelected ? 'ring-2 ring-primary-500' : ''
                  } ${
                    dayHolidays.length > 0 ? 'bg-red-50 dark:bg-red-900/10' : ''
                  }`}
                  onClick={() => day && setSelectedDate(new Date(year, month, day))}
                >
                  {day}
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full px-1">
                    {dayHolidays.slice(0, 2).map((h, j) => (
                      <div key={`h-${j}`} className={`w-1.5 h-1.5 rounded-full ${getHolidayColorClass(h.holidayType)}`} title={h.name} />
                    ))}
                    {dayEvents.slice(0, 2).map((_, j) => (
                      <div key={`e-${j}`} className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Details */}
          <AnimatePresence mode="wait">
            {selectedDate && (
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card rounded-2xl p-4 sm:p-5"
              >
                <h3 className="font-semibold mb-3 text-sm">
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                {(() => {
                  const d = selectedDate.getDate();
                  const h = holidaysForDate(d);
                  const e = eventsForDate(d);
                  if (h.length === 0 && e.length === 0) {
                    return <p className="text-xs text-slate-500">No events or holidays.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {h.map((hol) => (
                        <div key={hol.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                          <Sun className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{hol.name}</p>
                            <p className="text-[10px] text-red-600 dark:text-red-400 uppercase">{hol.holidayType === 'PUBLIC_HOLIDAY' ? 'Public Holiday' : 'School Event'}</p>
                          </div>
                        </div>
                      ))}
                      {e.map((ev, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/10">
                          <CalendarDays className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{ev.title}</p>
                            <p className="text-[10px] text-slate-500">{ev.eventType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming Holidays */}
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-red-500" /> Upcoming Holidays
            </h3>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {holidays.length === 0 ? (
                <p className="text-sm text-slate-500">No holidays configured</p>
              ) : (
                holidays
                  .filter((h) => new Date(h.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <Sun className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{h.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(h.date).toLocaleDateString()} • {h.holidayType === 'PUBLIC_HOLIDAY' ? 'Public Holiday' : 'School Event'}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary-500" /> Upcoming Events
            </h3>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming events</p>
              ) : (
                events.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(e.startDate).toLocaleDateString()}
                      </p>
                      {e.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {e.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" /> Announcements
            </h3>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {announcements.length === 0 ? (
                <p className="text-sm text-slate-500">No active announcements</p>
              ) : (
                announcements.map((a, i) => (
                  <div key={i} className={`p-3 rounded-lg ${a.isPinned ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30' : 'bg-white/50 dark:bg-slate-800/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {a.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                      <p className="text-sm font-medium">{a.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{a.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Event" size="md">
        <div className="space-y-4">
          <input className="glass-input w-full" placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
          <textarea className="glass-input w-full" placeholder="Description" rows={3} value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
          <input className="glass-input w-full" placeholder="Location" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
          <input type="datetime-local" className="glass-input w-full" value={newEvent.startDate} onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })} />
          <select className="glass-input w-full" value={newEvent.eventType} onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}>
            <option value="GENERAL">General</option>
            <option value="ACADEMIC">Academic</option>
            <option value="SPORTS">Sports</option>
            <option value="EXAM">Exam</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="MEETING">Meeting</option>
          </select>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary text-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <Button onClick={createEvent}>Create Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
