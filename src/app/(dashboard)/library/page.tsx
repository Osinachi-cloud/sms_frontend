'use client';

import { libraryApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Library, Search, BookOpen, Download, Plus, FileText, Headphones, Video } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';

export default function LibraryPage() {
  const { currentSchool } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const defaultBooks = [
    { id: '1', title: 'Introduction to Mathematics', author: 'Dr. John Smith', fileType: 'PDF', coverImageUrl: '', isDigital: true, availableCopies: 5, categoryName: 'Mathematics' },
    { id: '2', title: 'English Grammar Essentials', author: 'Jane Doe', fileType: 'PDF', coverImageUrl: '', isDigital: true, availableCopies: 3, categoryName: 'English' },
    { id: '3', title: 'Basic Physics Concepts', author: 'Prof. Alan Grant', fileType: 'VIDEO', coverImageUrl: '', isDigital: true, availableCopies: 1, categoryName: 'Science' },
    { id: '4', title: 'World History: Ancient Times', author: 'Sarah Connor', fileType: 'EPUB', coverImageUrl: '', isDigital: true, availableCopies: 2, categoryName: 'History' },
    { id: '5', title: 'Coding for Kids - Scratch', author: 'Mark Zuckerberg', fileType: 'PDF', coverImageUrl: '', isDigital: true, availableCopies: 10, categoryName: 'STEM' },
  ];

  useEffect(() => {
    if (currentSchool?.id) {
      loadBooks();
    }
  }, [currentSchool]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await libraryApi.getAll(currentSchool!.id, { size: 50 });
      const items = normalizeListResponse<any>(res.data).items;
      setBooks(items.length ? items : defaultBooks);
    } catch {
      setBooks(defaultBooks);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search || !currentSchool?.id) return;
    const res = await libraryApi.search(currentSchool.id, search);
    setBooks(res.data || []);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'AUDIO': return <Headphones className="w-4 h-4" />;
      case 'VIDEO': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6" data-tour="library">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold gradient-text">Digital Library</h1>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Book
        </Button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search books, authors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="glass-input w-full max-w-md"
        />
        <button onClick={handleSearch} className="btn-secondary"><Search className="w-4 h-4" /></button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden group"
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
                {book.coverImageUrl ? (
                  <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{book.fileType}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="p-3 rounded-full bg-white/90 text-slate-900">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  {getIcon(book.fileType)}
                  <span>{book.categoryName || 'General'}</span>
                </div>
                <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-0.5">{book.title}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">{book.author}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Book" size="md">
        <div className="space-y-4">
          <input className="glass-input w-full" placeholder="Title" />
          <input className="glass-input w-full" placeholder="Author" />
          <input className="glass-input w-full" placeholder="ISBN (optional)" />
          <select className="glass-input w-full">
            <option value="PDF">PDF</option>
            <option value="EPUB">EPUB</option>
            <option value="AUDIO">Audio</option>
            <option value="VIDEO">Video</option>
            <option value="LINK">External Link</option>
          </select>
          <input type="file" className="glass-input w-full" />
          <Button className="w-full"><Plus className="w-4 h-4" /> Add to Library</Button>
        </div>
      </Modal>
    </div>
  );
}
