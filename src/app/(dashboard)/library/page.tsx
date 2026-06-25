'use client';

import { libraryApi, uploadApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Library, Search, BookOpen, Download, Plus, FileText, Headphones, Video, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { normalizeListResponse } from '@/lib/utils';

export default function LibraryPage() {
  const { user, currentSchool, isPlatformAdmin, hasPermission } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    fileType: 'PDF',
    description: '',
    audienceRoles: ['STUDENT', 'TEACHER', 'PARENT'],
  });

  const roleName = currentSchool?.roleName?.toLowerCase() || '';
  const canManage = isPlatformAdmin() || 
                   roleName.includes('admin') || 
                   roleName.includes('teacher') || 
                   roleName.includes('librarian') ||
                   hasPermission('library.books.manage');

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
      setBooks(items);
    } catch (err) {
      console.error('Load failed', err);
      setBooks([]);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search || !currentSchool?.id) return;
    const res = await libraryApi.search(currentSchool.id, search);
    setBooks(res.data || []);
  };

  const handleDelete = async (bookId: string) => {
    if (!currentSchool?.id || !confirm('Are you sure you want to delete this book?')) return;
    try {
      await libraryApi.delete(currentSchool.id, bookId);
      setBooks(books.filter(b => b.id !== bookId));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddBook = async () => {
    if (!currentSchool?.id || !newBook.title) return;
    setSubmitting(true);
    try {
      let fileUrl = '';
      if (selectedFile) {
        const uploadRes = await uploadApi.upload(currentSchool.id, selectedFile, 'library');
        fileUrl = uploadRes.data.url;
      }

      const res = await libraryApi.create(currentSchool.id, {
        ...newBook,
        fileUrl,
      });
      setBooks([res.data, ...books]);
      setShowAdd(false);
      setSelectedFile(null);
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        fileType: 'PDF',
        description: '',
        audienceRoles: ['STUDENT', 'TEACHER', 'PARENT'],
      });
    } catch (err) {
      console.error('Add failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (book: any) => {
    if (!book.fileUrl) {
      alert('No download link available for this book.');
      return;
    }
    
    // Ensure the URL is absolute if it starts with /uploads
    const downloadUrl = book.fileUrl.startsWith('/') 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'}${book.fileUrl}`
      : book.fileUrl;

    try {
      // Fetch the file as a blob to bypass cross-origin restrictions on the 'download' attribute
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title}.${book.fileType.toLowerCase() || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback to direct link if fetch fails
      window.open(downloadUrl, '_blank');
    }
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
        {canManage && (
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Book
          </Button>
        )}
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
      ) : books.length > 0 ? (
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
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleDownload(book)}
                    className="p-3 rounded-full bg-white/90 text-slate-900 hover:bg-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  {canManage && (
                    <button 
                      onClick={() => handleDelete(book.id)}
                      className={`p-3 rounded-full text-white transition-colors ${
                        (isPlatformAdmin() || roleName.includes('admin') || book.createdBy === user?.id)
                          ? 'bg-red-500/90 hover:bg-red-500'
                          : 'bg-slate-400/50 cursor-not-allowed'
                      }`}
                      disabled={!(isPlatformAdmin() || roleName.includes('admin') || book.createdBy === user?.id)}
                      title={(isPlatformAdmin() || roleName.includes('admin') || book.createdBy === user?.id) ? 'Delete' : 'Only owners or admins can delete'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <BookOpen className="w-12 h-12 mb-4 opacity-20" />
          <p>No books found in the library</p>
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Book" size="md">
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">Title</label>
              <input 
                className="glass-input w-full" 
                placeholder="e.g. Advanced Physics" 
                value={newBook.title}
                onChange={e => setNewBook({...newBook, title: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">Author</label>
              <input 
                className="glass-input w-full" 
                placeholder="e.g. Stephen Hawking" 
                value={newBook.author}
                onChange={e => setNewBook({...newBook, author: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">ISBN</label>
              <input 
                className="glass-input w-full" 
                placeholder="Optional" 
                value={newBook.isbn}
                onChange={e => setNewBook({...newBook, isbn: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">Format</label>
              <select 
                className="glass-input w-full"
                value={newBook.fileType}
                onChange={e => setNewBook({...newBook, fileType: e.target.value})}
              >
                <option value="PDF">PDF Document</option>
                <option value="EPUB">ePub eBook</option>
                <option value="AUDIO">Audio Book</option>
                <option value="VIDEO">Video Lecture</option>
                <option value="LINK">External Link</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">Audience (Visible to)</label>
            <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              {['STUDENT', 'TEACHER', 'PARENT', 'LIBRARIAN'].map(role => (
                <label key={role} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                    checked={newBook.audienceRoles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewBook({...newBook, audienceRoles: [...newBook.audienceRoles, role]});
                      } else {
                        setNewBook({...newBook, audienceRoles: newBook.audienceRoles.filter(r => r !== role)});
                      }
                    }}
                  />
                  <span className="text-xs font-medium">{role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">Description</label>
            <textarea 
              className="glass-input w-full min-h-[80px]" 
              placeholder="Brief summary of the book..." 
              value={newBook.description}
              onChange={e => setNewBook({...newBook, description: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">Upload File</label>
            <div 
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <div className={`glass-input w-full py-4 border-dashed border-2 flex flex-col items-center justify-center gap-2 transition-colors ${selectedFile ? 'border-primary-500 bg-primary-500/5' : 'group-hover:border-primary-400'}`}>
                {selectedFile ? (
                  <>
                    <FileText className="w-5 h-5 text-primary-500" />
                    <span className="text-xs text-primary-600 font-medium">{selectedFile.name}</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-primary-400" />
                    <span className="text-xs text-slate-500">Click to upload book file</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button 
            onClick={handleAddBook}
            disabled={submitting || !newBook.title}
            className="w-full h-11 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20"
          >
            {submitting ? 'Adding...' : 'Add to Library'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
